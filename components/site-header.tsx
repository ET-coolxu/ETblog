import Link from "next/link";
import { getSiteConfig } from "@/lib/site";
import { SiteNav } from "@/components/site-nav";

/**
 * 前台页眉：左品牌、右导航。跟随文档流，不吸顶。
 */
export function SiteHeader() {
  const site = getSiteConfig();

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex w-full max-w-site flex-col items-stretch gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="shrink-0 self-start whitespace-nowrap font-serif text-base font-semibold text-ink sm:text-lg"
        >
          {site.name}
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
