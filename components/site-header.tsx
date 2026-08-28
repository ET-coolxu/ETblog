import Link from "next/link";
import { getSiteConfig } from "@/lib/site";

const navItems = [
  { href: "/posts", label: "文章" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
  { href: "/search", label: "搜索" },
];

export function SiteHeader() {
  const site = getSiteConfig();

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-serif text-lg font-semibold text-ink">
          {site.name}
        </Link>
        <nav aria-label="站点" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
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
      </div>
    </header>
  );
}
