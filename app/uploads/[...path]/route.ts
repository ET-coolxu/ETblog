import { NextResponse } from "next/server";
import { readUploadedImage } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * 提供运行时写入 `public/uploads` 的图片。
 * standalone 生产服务只出构建期 `public/` 清单，新上传的文件必须由本路由读盘。
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const result = await readUploadedImage(segments.join("/"));
  if (!result.ok) {
    return new NextResponse(null, { status: 404 });
  }

  // Node Buffer（@types/node 22 为 Buffer<ArrayBufferLike>）不能赋给 DOM BodyInit。
  return new NextResponse(Uint8Array.from(result.bytes), {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
