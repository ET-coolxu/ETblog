import { NextRequest, NextResponse } from "next/server";
import { isPublishAuthorized } from "@/lib/publish-auth";
import {
  failureFromSaveError,
  inputForCreate,
  isPublishStatus,
  readJsonObject,
  statusFromIntent,
  toListItem,
  toWriteSuccess,
} from "@/lib/publish-posts";
import { listAdminPosts, savePost } from "@/lib/posts";
import { revalidatePostSurfaces } from "@/lib/revalidate-posts";

export const runtime = "nodejs";

/** 文章在磁盘上，列表必须按请求读取，不能在构建时定格。 */
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function jsonFailure(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * 列出全部文章（含草稿与存档）。可选 ?status= 筛选；非法取值拒绝，不当成全部。
 */
export async function GET(request: NextRequest) {
  if (!isPublishAuthorized(request.headers.get("authorization"))) {
    return unauthorized();
  }

  const status = request.nextUrl.searchParams.get("status");
  if (status !== null && !isPublishStatus(status)) {
    return jsonFailure("status 只能是 published、draft 或 archived。", 400);
  }

  const posts = await listAdminPosts();
  const items = posts
    .map(toListItem)
    .filter((post) => status === null || post.status === status);

  return NextResponse.json({ ok: true, posts: items });
}

/** 新建文章。手填 slug 交给 savePost 追加全站序号，这里不再预分配。 */
export async function POST(request: NextRequest) {
  if (!isPublishAuthorized(request.headers.get("authorization"))) {
    return unauthorized();
  }

  const body = await readJsonObject(request);
  if (!body.ok) {
    return jsonFailure(body.error, body.status);
  }

  const input = inputForCreate(body.value);
  if (!input.ok) {
    return jsonFailure(input.error, input.status);
  }

  const saved = await savePost(input.input, "create");
  if (!saved.ok) {
    const failure = failureFromSaveError(saved.error);
    return jsonFailure(failure.error, failure.status);
  }

  revalidatePostSurfaces(saved.slug, input.input.tags);
  const status = statusFromIntent(input.input.intent);
  return NextResponse.json(toWriteSuccess(saved.slug, status));
}
