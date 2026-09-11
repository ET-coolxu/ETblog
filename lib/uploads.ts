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

function resolveUploadPath(yyyy: string, mm: string, filename: string): string | null {
  const filePath = path.resolve(UPLOADS_ROOT, yyyy, mm, filename);
  const relative = path.relative(UPLOADS_ROOT, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return filePath;
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
