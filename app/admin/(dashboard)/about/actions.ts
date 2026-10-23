"use server";

import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/lib/auth";
import { saveAboutSource } from "@/lib/posts";

export type SaveAboutState = {
  error?: string;
  message?: string;
};

/**
 * 已登录管理员保存关于页正文。
 * 写盘前再验 session。成功后只刷新 `/about` 与 `/admin/about`，不刷新文章页面。
 */
export async function saveAboutAction(
  _prev: SaveAboutState,
  formData: FormData,
): Promise<SaveAboutState> {
  if (!(await hasAdminSession())) {
    return { error: "请先登录。" };
  }

  const result = await saveAboutSource(String(formData.get("body") ?? ""));
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { message: "已保存，前台关于页已更新。" };
}
