"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <header className="border-b border-rule">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/admin" className="font-serif text-lg font-semibold text-ink">
            {siteName}
            <span className="ml-2 text-sm font-normal text-muted">后台</span>
          </Link>
          <nav aria-label="后台" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href, item.match) ? "text-ink" : "hover:text-ink"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-x-4 text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            前台
          </Link>
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="hover:text-ink">
              登出
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
