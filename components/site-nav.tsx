"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/posts", label: "文章" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
  { href: "/search", label: "搜索" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="站点" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={isActive(pathname, item.href) ? "text-ink" : "hover:text-ink"}
        >
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        disabled
        title="主题切换将在后续阶段提供"
        className="cursor-not-allowed text-muted/70"
      >
        主题
      </button>
    </nav>
  );
}
