import type { Metadata } from "next";
import { EmptyState } from "@/components/post-card";
import { renderMarkdown } from "@/lib/markdown";
import { getAboutSource } from "@/lib/posts";

export const metadata: Metadata = {
  title: "关于",
};

export default async function AboutPage() {
  const source = await getAboutSource();

  return (
    <main className="mx-auto w-full max-w-site px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-ink">关于</h1>
      {source ? (
        <div className="markdown mt-10">{await renderMarkdown(source)}</div>
      ) : (
        <div className="mt-10">
          <EmptyState>尚未填写关于页。</EmptyState>
        </div>
      )}
    </main>
  );
}
