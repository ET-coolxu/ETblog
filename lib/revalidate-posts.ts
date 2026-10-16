/**
 * 文章写入或删除后的缓存刷新。后台表单与 Publish API 共用，避免两边漏掉不同页面。
 */
import { revalidatePath } from "next/cache";
import { tagHref } from "@/lib/posts";

/**
 * 合并写入前后的标签。更新时撤掉的标签页也要刷新，否则列表里还会留着这篇文章。
 */
export function mergePostTags(before: readonly string[] | undefined, after: readonly string[]): string[] {
  return [...new Set([...(before ?? []), ...after])];
}

/**
 * 刷新首页、列表、该文、标签、搜索、feed、sitemap 和后台。
 * 不整站重建。tags 传本次涉及的标签（更新时用 mergePostTags）。
 */
export function revalidatePostSurfaces(slug: string, tags: readonly string[]): void {
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
