import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site";
import { saveUploadedImage } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * 判断上传是否来自本站。
 * 不能只比 `request.url`：Caddy 反代后 Host/协议会变成容器内的 `http://app:3000`，
 * 浏览器 Origin 仍是对外的 `SITE_URL`（如 `https://coolxu.com`），会被误判成跨站。
 */
function isAllowedOrigin(request: Request): boolean {
  const raw = request.headers.get("origin");
  if (!raw) {
    return false;
  }

  let origin: string;
  try {
    origin = new URL(raw).origin;
  } catch {
    return false;
  }

  const allowed = new Set<string>();
  try {
    allowed.add(new URL(getSiteConfig().url).origin);
  } catch {
    // SITE_URL 非法时仍允许本地直连（request.url）通过
  }
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    // 忽略无法解析的 request.url
  }

  return allowed.has(origin);
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "请求来源不被允许。" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择要上传的图片。" }, { status: 400 });
  }

  const result = await saveUploadedImage(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ url: result.url });
}
