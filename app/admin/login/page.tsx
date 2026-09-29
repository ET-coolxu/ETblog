import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/login-form";
import { hasAdminSession } from "@/lib/auth";
import { getSiteConfig, type SiteConfig } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "登录",
};

/** 页脚只用已配置的主机；地址不合法时退回站名，不编造域名。 */
function loginFooter(site: SiteConfig): string {
  try {
    const host = new URL(site.url).host;
    if (host) {
      return host;
    }
  } catch {
    // SITE_URL 不是合法地址
  }
  return site.name;
}

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  const site = getSiteConfig();

  return (
    <div className={styles.split}>
      <aside className={styles.brand}>
        <div>
          <p className={styles.siteName}>{site.name}</p>
          <p className={styles.kicker}>写作后台</p>
        </div>
        <div className={styles.mottoBlock}>
          <p className={styles.motto}>安静写字，清晰管理。</p>
          <p className={styles.note}>单管理员工作台</p>
        </div>
        <p className={styles.foot}>{loginFooter(site)}</p>
      </aside>
      <main className={styles.panel}>
        <div className={styles.card}>
          <h1 className={styles.title}>登录后台</h1>
          <p className={styles.intro}>使用管理员账号进入工作台</p>
          <LoginForm />
          <p className={styles.back}>
            <Link href="/" className={styles.backLink}>
              ← 返回前台
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
