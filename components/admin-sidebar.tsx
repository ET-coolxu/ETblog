"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { logoutAction } from "@/app/admin/login/actions";
import styles from "./admin-sidebar.module.css";

type NavKey = "posts" | "write" | "stats";

const navItems: { href: string; label: string; key: NavKey }[] = [
  { href: "/admin", label: "文章", key: "posts" },
  { href: "/admin/posts/new", label: "写文章", key: "write" },
  { href: "/admin/stats", label: "统计", key: "stats" },
];

/**
 * 侧栏选中。文章只认 `/admin`；写文章同时覆盖新建和编辑已有文章。
 */
function isNavActive(pathname: string, key: NavKey): boolean {
  if (key === "posts") {
    return pathname === "/admin";
  }
  if (key === "write") {
    return pathname.startsWith("/admin/posts/");
  }
  return pathname === "/admin/stats" || pathname.startsWith("/admin/stats/");
}

/** 登录后的后台侧栏。路径、主题和登出都在浏览器里处理，不读密钥、不查库。 */
export function AdminSidebar({ siteName }: { siteName: string }) {
  const pathname = usePathname();

  return (
    <aside className={styles.aside}>
      <div className={styles.brandWrap}>
        <Link href="/admin" className={styles.brand}>
          {siteName}
          <span className={styles.badge}>后台</span>
        </Link>
      </div>
      <nav aria-label="后台" className={styles.nav}>
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.key);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={active ? `${styles.item} ${styles.current}` : styles.item}
            >
              <NavIcon name={item.key} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.tools}>
        <Link href="/" target="_blank" rel="noopener noreferrer" className={styles.item}>
          <ExternalIcon />
          前台
        </Link>
        <ThemeButton />
        <form action={logoutAction} className={styles.toolForm}>
          <button type="submit" className={styles.item}>
            <LogoutIcon />
            登出
          </button>
        </form>
      </div>
    </aside>
  );
}

/** 浅色 / 深色切换，沿用 next-themes。按钮上保留「主题」二字。 */
function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={styles.item}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? isDark ? <SunIcon /> : <MoonIcon /> : <span className={styles.icon} aria-hidden />}
      主题
    </button>
  );
}

function NavIcon({ name }: { name: NavKey }) {
  if (name === "posts") {
    return (
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "write") {
    return (
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
        <path d="M12 20h9" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path
          d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
      <path
        d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
      <path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M15 3h6v6M10 14 21 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
      <path
        d="M16.5 14.2A6.2 6.2 0 0 1 9.8 7.5 6.2 6.2 0 1 0 16.5 14.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
