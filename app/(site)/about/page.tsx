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
    <main className="page">
      <h1 className="doc-title">关于</h1>
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
