import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

export const runtime = "nodejs";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
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
