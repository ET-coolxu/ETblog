import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/login-form";
import { hasAdminSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "登录",
};

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  const site = getSiteConfig();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-24">
      <p className="text-sm text-muted">
        <Link href="/" className="hover:text-ink">
          {site.name}
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">登录后台</h1>
      <p className="mt-3 text-sm leading-7 text-muted">使用管理员账号继续写稿。</p>
      <LoginForm />
    </main>
  );
}
