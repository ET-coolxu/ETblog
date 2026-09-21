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
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-serif text-lg font-semibold text-ink">
          {site.name}
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
