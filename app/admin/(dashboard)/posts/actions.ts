"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/auth";
import { renderMarkdownPreviewHtml } from "@/lib/markdown";
import {
  deletePost,
  getAdminPost,
  savePost,
  tagHref,
  type SavePostInput,
  type SavePostIntent,
} from "@/lib/posts";
import { deletePostViews } from "@/lib/stats";

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

/**
 * 只接受草稿 / 发布 / 存档。未知 intent（含伪造的 delete）不当成草稿。
 */
function parseSaveIntent(formData: FormData): SavePostIntent | null {
  const raw = String(formData.get("intent") ?? "");
  if (raw === "draft" || raw === "publish" || raw === "archive") {
    return raw;
  }
  return null;
}

function inputFromForm(
  formData: FormData,
  slug: string,
  intent: SavePostIntent,
): SavePostInput {
  return {
    slug,
    title: String(formData.get("title") ?? ""),
    date: String(formData.get("date") ?? ""),
    tags: parseTags(String(formData.get("tags") ?? "")),
    summary: String(formData.get("summary") ?? ""),
    cover: String(formData.get("cover") ?? ""),
    featured: formData.get("featured") === "on",
    intent,
    body: String(formData.get("body") ?? ""),
  };
}

function saveMessage(intent: SavePostIntent): string {
  if (intent === "draft") {
    return "草稿已保存。";
  }
  if (intent === "archive") {
    return "已存档，前台已撤下。";
  }
  return "已发布，前台已更新。";
}

/** 写入或删除后刷新公开页、该文旧路径与后台，避免缓存里仍是旧状态。 */
function revalidatePostSurfaces(slug: string, tags: string[]) {
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/tags", "layout");
  revalidatePath("/search");
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  revalidatePath(`/admin/posts/${slug}`);
  revalidatePath("/admin/stats");
  for (const tag of tags) {
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

  const intent = parseSaveIntent(formData);
  if (!intent) {
    return { error: "未知操作。" };
  }

  const hand = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const input = inputFromForm(formData, hand, intent);
  const result = await savePost(input, "create");
  if (!result.ok) {
    return { error: result.error };
  }

  // 首次保存已追加全站序号，必须按最终 slug 刷新缓存并跳转
  revalidatePostSurfaces(result.slug, input.tags);
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

  const intent = parseSaveIntent(formData);
  if (!intent) {
    return { error: "未知操作。" };
  }

  const input = inputFromForm(formData, slug, intent);
  const result = await savePost(input, "update");
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePostSurfaces(input.slug, input.tags);
  return { message: saveMessage(intent) };
}

/**
 * 确认后删除 Markdown 与该 slug 的 PV；不碰上传目录。
 * 先删文件（信源），PV 失败只打日志，仍视为已删。
 */
export async function deletePostAction(
  slug: string,
  _prev: SaveState,
  _formData: FormData,
): Promise<SaveState> {
  if (!(await hasAdminSession())) {
    return { error: "请先登录。" };
  }

  const existing = await getAdminPost(slug);
  const result = await deletePost(slug);
  if (!result.ok) {
    return { error: result.error };
  }

  deletePostViews(slug);
  revalidatePostSurfaces(slug, existing?.tags ?? []);
  redirect("/admin");
}

export async function previewMarkdownAction(source: string): Promise<string> {
  if (!(await hasAdminSession())) {
    return "";
  }

  return renderMarkdownPreviewHtml(source);
}
