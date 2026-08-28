import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import { listTags, tagHref } from "@/lib/posts";

export const metadata: Metadata = {
  title: "标签",
};

export default async function TagsPage() {
  const tags = await listTags();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink">标签</h1>
      {tags.length > 0 ? (
        <ul className="mt-10 space-y-4 border-l border-rule pl-6">
          {tags.map((item) => (
            <li key={item.tag} className="flex items-baseline justify-between gap-4">
              <Link href={tagHref(item.tag)} className="text-ink hover:text-pine">
                {item.tag}
              </Link>
              <span className="text-sm text-muted">{item.count} 篇</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10">
          <EmptyState>还没有标签。</EmptyState>
        </div>
      )}
    </main>
  );
}
