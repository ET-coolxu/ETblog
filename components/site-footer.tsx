import Link from "next/link";
import { getSiteConfig } from "@/lib/site";

export function SiteFooter() {
  const site = getSiteConfig();

  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-site items-center justify-between gap-4 px-4 py-5 text-sm text-muted sm:px-6">
        <p>{site.author}</p>
        <Link href="/feed.xml" className="hover:text-ink">
          RSS
        </Link>
      </div>
    </footer>
  );
}
