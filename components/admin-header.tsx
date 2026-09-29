"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import styles from "./admin-header.module.css";

const navItems = [
  { href: "/admin", label: "文章", match: "exact" as const },
  { href: "/admin/posts/new", label: "写文章", match: "exact" as const },
  { href: "/admin/stats", label: "统计", match: "prefix" as const },
];

function isActive(pathname: string, href: string, match: "exact" | "prefix"): boolean {
  if (match === "exact") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminHeader({ siteName }: { siteName: string }) {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <div className={styles.brandGroup}>
          <Link href="/admin" className={styles.brand}>
            {siteName}
            <span className={styles.badge}>后台</span>
          </Link>
          <nav aria-label="后台" className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href, item.match) ? styles.current : styles.item}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.tools}>
          <Link href="/" className={styles.tool}>
            前台
          </Link>
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className={styles.tool}>
              登出
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
