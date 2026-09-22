import type { Metadata } from "next";
import { EmptyState, PostCard } from "@/components/post-card";
import { searchPublishedPosts } from "@/lib/search";

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
    <main className="mx-auto w-full max-w-site px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-ink">搜索</h1>
      <form action="/search" method="get" className="mt-8 flex gap-3" role="search">
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
          className="min-w-0 flex-1 border-b border-rule bg-transparent py-2 text-ink outline-none placeholder:text-muted"
        />
        <button type="submit" className="shrink-0 text-pine hover:text-ink">
          搜索
        </button>
      </form>

      {query ? (
        results.length > 0 ? (
          <div className="mt-10 space-y-10">
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
        <p className="mt-10 text-muted">输入关键词，搜索已发布文章的标题、摘要和正文。</p>
      )}
    </main>
  );
}
