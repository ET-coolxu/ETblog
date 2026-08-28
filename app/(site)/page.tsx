import { getSiteConfig } from "@/lib/site";

export default function HomePage() {
  const site = getSiteConfig();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <div className="border-l border-rule pl-8 sm:pl-10">
        <p className="text-sm tracking-wide text-pine">笔记</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-snug text-ink sm:text-4xl">
          {site.name}
        </h1>
        <p className="mt-5 max-w-prose text-base leading-8 text-muted">
          {site.intro}
        </p>
        <p className="mt-12 text-sm text-muted">
          精选与最新文章将在下一阶段出现。
        </p>
      </div>
    </main>
  );
}
