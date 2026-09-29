import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/login-form";
import { hasAdminSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "登录",
};

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  const site = getSiteConfig();

  return (
    <main className={styles.main}>
      <p className={styles.site}>
        <Link href="/" className="link-quiet">
          {site.name}
        </Link>
      </p>
      <h1 className="doc-title mt-4">登录后台</h1>
      <p className={styles.intro}>使用管理员账号继续写稿。</p>
      <LoginForm />
    </main>
  );
}
