import Link from "next/link";
import { getSiteConfig } from "@/lib/site";

export function SiteFooter() {
  const site = getSiteConfig();

  return (
    <footer className="bg-paper">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 px-5 py-12 font-label text-[11px] font-semibold tracking-wide text-quiet sm:flex-row md:px-4">
        <p className="flex items-center gap-1.5">
          <span>{site.author}</span>
          <span aria-hidden>·</span>
          <Link href="/feed.xml" className="hover:text-muted">
            RSS
          </Link>
          <span aria-hidden>·</span>
          <span>© {new Date().getFullYear()}</span>
        </p>
        <p>Thoughtful, minimal reading</p>
      </div>
    </footer>
  );
}
