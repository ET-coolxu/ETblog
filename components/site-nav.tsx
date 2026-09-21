"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const pageItems = [
  { href: "/posts", label: "文章" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 前台顶栏导航：页面链接一组，搜索与主题为右侧工具组。
 * 不含访客头像；粘滞定位由页眉决定（当前不吸顶）。
 */
export function SiteNav() {
  const pathname = usePathname();
  const searchActive = isActive(pathname, "/search");

  return (
    <nav
      aria-label="站点"
      className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm text-muted"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {pageItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(pathname, item.href) ? "text-ink" : "hover:text-ink"}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {/* 搜索/主题单独成组，和页面链接拉开 */}
      <div className="flex items-center gap-x-4 border-l border-rule pl-5">
        <Link
          href="/search"
          className={searchActive ? "text-ink" : "hover:text-ink"}
        >
          搜索
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
