"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/auth";
import { renderMarkdownPreviewHtml } from "@/lib/markdown";
import { savePost, tagHref, type SavePostInput } from "@/lib/posts";

export type SaveState = {
  error?: string;
  message?: string;
};

function parseTags(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function inputFromForm(formData: FormData, slug: string): SavePostInput {
  return {
    slug,
    title: String(formData.get("title") ?? ""),
    date: String(formData.get("date") ?? ""),
    tags: parseTags(String(formData.get("tags") ?? "")),
    summary: String(formData.get("summary") ?? ""),
    cover: String(formData.get("cover") ?? ""),
    featured: formData.get("featured") === "on",
    draft: String(formData.get("intent") ?? "draft") !== "publish",
    body: String(formData.get("body") ?? ""),
  };
}

function revalidateAfterSave(input: SavePostInput) {
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${input.slug}`);
  revalidatePath("/tags", "layout");
  revalidatePath("/search");
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  revalidatePath(`/admin/posts/${input.slug}`);
  for (const tag of input.tags) {
    revalidatePath(tagHref(tag));
  }
}

export async function createPostAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  if (!(await hasAdminSession())) {
    return { error: "请先登录。" };
  }

  const hand = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const input = inputFromForm(formData, hand);
  const result = await savePost(input, "create");
  if (!result.ok) {
    return { error: result.error };
  }

  // 首次保存已追加全站序号，必须按最终 slug 刷新缓存并跳转
  const saved = { ...input, slug: result.slug };
  revalidateAfterSave(saved);
  redirect(`/admin/posts/${result.slug}`);
}

export async function updatePostAction(
  slug: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  if (!(await hasAdminSession())) {
    return { error: "请先登录。" };
  }

  const input = inputFromForm(formData, slug);
  const result = await savePost(input, "update");
  if (!result.ok) {
    return { error: result.error };
  }

  revalidateAfterSave(input);
  return { message: input.draft ? "草稿已保存。" : "已发布，前台已更新。" };
}

export async function previewMarkdownAction(source: string): Promise<string> {
  if (!(await hasAdminSession())) {
    return "";
  }

  return renderMarkdownPreviewHtml(source);
}
