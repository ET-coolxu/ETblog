import { NextRequest, NextResponse } from "next/server";
import { isPublishAuthorized } from "@/lib/publish-auth";
import {
  failureFromSaveError,
  inputForUpdate,
  readJsonObject,
  statusFromIntent,
  toDetail,
  toWriteSuccess,
} from "@/lib/publish-posts";
import { getAdminPost, isValidSlug, readStoredSummary, savePost } from "@/lib/posts";
import { mergePostTags, revalidatePostSurfaces } from "@/lib/revalidate-posts";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

type SlugContext = { params: Promise<{ slug: string }> };

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function jsonFailure(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * 非法 slug 与不存在分开：前者 400，后者 404。
 * 避免把路径穿越或非法字符说成「找不到文章」。
 */
async function resolveSlug(context: SlugContext): Promise<
  { ok: true; slug: string } | { ok: false; response: NextResponse }
> {
  const { slug } = await context.params;
  if (!isValidSlug(slug)) {
    return { ok: false, response: jsonFailure("slug 不合法。", 400) };
  }
  return { ok: true, slug };
}

/** 后台视角读取一篇，含草稿、存档和正文。 */
export async function GET(request: NextRequest, context: SlugContext) {
  if (!isPublishAuthorized(request.headers.get("authorization"))) {
    return unauthorized();
  }

  const slug = await resolveSlug(context);
  if (!slug.ok) {
    return slug.response;
  }

  const post = await getAdminPost(slug.slug);
  if (!post) {
    return jsonFailure("找不到这篇文章。", 404);
  }

  return NextResponse.json({ ok: true, post: toDetail(post) });
}

/** 部分更新。只改提交的字段，状态机仍由 savePost 校验。 */
export async function PATCH(request: NextRequest, context: SlugContext) {
  if (!isPublishAuthorized(request.headers.get("authorization"))) {
    return unauthorized();
  }

  const slug = await resolveSlug(context);
  if (!slug.ok) {
    return slug.response;
  }

  const current = await getAdminPost(slug.slug);
  if (!current) {
    return jsonFailure("找不到这篇文章。", 404);
  }

  const body = await readJsonObject(request);
  if (!body.ok) {
    return jsonFailure(body.error, body.status);
  }

  const storedSummary = (await readStoredSummary(slug.slug)) ?? "";
  const input = inputForUpdate(slug.slug, current, storedSummary, body.value);
  if (!input.ok) {
    return jsonFailure(input.error, input.status);
  }

  const saved = await savePost(input.input, "update");
  if (!saved.ok) {
    const failure = failureFromSaveError(saved.error);
    return jsonFailure(failure.error, failure.status);
  }

  revalidatePostSurfaces(saved.slug, mergePostTags(current.tags, input.input.tags));
  return NextResponse.json(toWriteSuccess(saved.slug, statusFromIntent(input.input.intent)));
}
