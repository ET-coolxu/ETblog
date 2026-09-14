import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED = {
  png: { ext: ".png" },
  jpeg: { ext: ".jpg" },
  webp: { ext: ".webp" },
  gif: { ext: ".gif" },
} as const;

type ImageKind = keyof typeof ALLOWED;

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function detectKind(bytes: Buffer): ImageKind | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  if (bytes.length >= 6) {
    const header = bytes.subarray(0, 6).toString("ascii");
    if (header === "GIF87a" || header === "GIF89a") {
      return "gif";
    }
  }
  return null;
}

function looksLikeSvg(bytes: Buffer): boolean {
  const head = bytes.subarray(0, 256).toString("utf8").trim().toLowerCase();
  return head.startsWith("<svg") || head.includes("<svg") || head.startsWith("<?xml");
}

function safeBaseName(original: string): string {
  const base = original.replace(/\.[^.]+$/, "");
  const cleaned = base
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return cleaned || "image";
}

const SERVE_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/**
 * 把 `public/uploads` 下的相对路径解析成绝对路径。
 * 含 `..`、空段或越出目录时返回 null，禁止读目录外的文件。
 */
function resolveUploadRelative(relativePath: string): string | null {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("\0")) {
    return null;
  }
  const segments = normalized.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return null;
  }

  const filePath = path.resolve(UPLOADS_ROOT, ...segments);
  const relative = path.relative(UPLOADS_ROOT, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return filePath;
}

function resolveUploadPath(yyyy: string, mm: string, filename: string): string | null {
  return resolveUploadRelative(`${yyyy}/${mm}/${filename}`);
}

export type ServedUpload =
  | { ok: true; bytes: Buffer; contentType: string }
  | { ok: false };

/**
 * 按 `/uploads/` 后的相对路径读取已保存的图片。
 * 只提供白名单扩展名；文件不存在或路径非法时失败，供公开路由使用。
 */
export async function readUploadedImage(relativePath: string): Promise<ServedUpload> {
  const filePath = resolveUploadRelative(relativePath);
  if (!filePath) {
    return { ok: false };
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = SERVE_TYPES[ext];
  if (!contentType) {
    return { ok: false };
  }

  try {
    const bytes = await fs.readFile(filePath);
    return { ok: true, bytes, contentType };
  } catch {
    return { ok: false };
  }
}

export async function saveUploadedImage(file: File): Promise<UploadResult> {
  if (file.size <= 0) {
    return { ok: false, error: "没有收到图片文件。" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "图片不能超过 5MB。" };
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".svg") || file.type === "image/svg+xml") {
    return { ok: false, error: "不允许上传 SVG。" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (looksLikeSvg(buffer)) {
    return { ok: false, error: "不允许上传 SVG。" };
  }

  const kind = detectKind(buffer);
  if (!kind) {
    return { ok: false, error: "只允许 png、jpg、jpeg、webp、gif。" };
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const filename = `${Date.now()}-${safeBaseName(file.name)}${ALLOWED[kind].ext}`;
  const filePath = resolveUploadPath(yyyy, mm, filename);
  if (!filePath) {
    return { ok: false, error: "无法保存这张图片。" };
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return { ok: true, url: `/uploads/${yyyy}/${mm}/${filename}` };
}
