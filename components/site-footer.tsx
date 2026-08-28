import Link from "next/link";
import { getSiteConfig } from "@/lib/site";

export function SiteFooter() {
  const site = getSiteConfig();

  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5 text-sm text-muted">
        <p>{site.author}</p>
        <Link href="/feed.xml" className="hover:text-ink">
          RSS
        </Link>
      </div>
    </footer>
  );
}
