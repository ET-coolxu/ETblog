import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { getSiteConfig } from "@/lib/site";

/** 公开站顶栏：左站名，右导航贴着搜索与主题。固定在顶部，正文靠 layout 的 pt-16 让开。 */
export function SiteHeader() {
  const site = getSiteConfig();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-5 md:px-4">
        <Link
          href="/"
          className="shrink-0 font-serif text-xl font-medium tracking-tight text-ink transition-colors hover:text-pine"
        >
          {site.name}
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
