import type { Metadata } from "next";
import { EmptyState, PostCard } from "@/components/post-card";
import { searchPublishedPosts } from "@/lib/search";
import styles from "./page.module.css";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();
  return {
    title: query ? `搜索：${query}` : "搜索",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchPublishedPosts(query) : [];

  return (
    <main className="page">
      <h1 className="doc-title">搜索</h1>
      <form action="/search" method="get" className={styles.form} role="search">
        <label htmlFor="search-q" className="sr-only">
          搜索关键词
        </label>
        <input
          id="search-q"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="搜索标题、摘要或正文"
          autoComplete="off"
          className={styles.input}
        />
        <button type="submit" className={`link ${styles.submit}`}>
          搜索
        </button>
      </form>

      {query ? (
        results.length > 0 ? (
          <div className={styles.results}>
            {results.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState>没有找到与「{query}」相关的已发布文章。</EmptyState>
          </div>
        )
      ) : (
        <p className="mt-10 muted">输入关键词，搜索已发布文章的标题、摘要和正文。</p>
      )}
    </main>
  );
}
