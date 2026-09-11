"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  hasAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminCredentials(username, password)) {
    return { error: "用户名或密码不正确。" };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
