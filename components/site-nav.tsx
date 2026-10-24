"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import styles from "./site-nav.module.css";

const navItems: ReadonlyArray<{
  href: string;
  label: string;
  also?: readonly string[];
}> = [
  { href: "/posts", label: "文章" },
  { href: "/columns", label: "专栏", also: ["/fleet"] },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemClass(active: boolean): string {
  return active ? styles.active : styles.item;
}

/** 右侧主导航，竖线后接搜索与主题，不放访客头像。 */
export function SiteNav() {
  const pathname = usePathname();
  const searchActive = isActive(pathname, "/search");

  return (
    <div className={styles.bar}>
      <nav aria-label="主导航" className={styles.nav}>
        {navItems.map((item) => {
          const active =
            isActive(pathname, item.href) ||
            (item.also?.some((path) => isActive(pathname, path)) ?? false);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={itemClass(active)}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <span className={styles.rule} aria-hidden />
      <div className={styles.tools}>
        <Link
          href="/search"
          aria-label="搜索"
          title="搜索"
          className={searchActive ? styles.searchOn : styles.search}
        >
          <SearchIcon />
          <span className={styles.label}>搜索</span>
        </Link>
        <ThemeToggle />
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-md" aria-hidden>
      <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
