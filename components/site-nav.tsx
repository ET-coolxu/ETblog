"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/posts", label: "文章" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemClass(active: boolean): string {
  return active
    ? "font-semibold text-pine"
    : "font-medium text-muted hover:text-ink";
}

/** 右侧主导航，竖线后接搜索与主题，不放访客头像。 */
export function SiteNav() {
  const pathname = usePathname();
  const searchActive = isActive(pathname, "/search");

  return (
    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      <nav aria-label="主导航" className="flex items-center gap-4 font-label text-[13px] md:gap-7">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={itemClass(isActive(pathname, item.href))}>
            {item.label}
          </Link>
        ))}
      </nav>
      <span className="h-4 w-px bg-rule" aria-hidden />
      <div className="flex items-center gap-1">
        <Link
          href="/search"
          aria-label="搜索"
          title="搜索"
          className={`inline-flex items-center gap-1 rounded px-1 py-1.5 font-label text-[11px] font-semibold tracking-wide ${
            searchActive ? "text-pine" : "text-muted hover:text-ink"
          }`}
        >
          <SearchIcon />
          <span className="hidden sm:inline">搜索</span>
        </Link>
        <ThemeToggle />
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden>
      <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
