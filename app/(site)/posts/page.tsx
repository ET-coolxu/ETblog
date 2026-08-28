import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { listPublishedPosts, postsHref } from "@/lib/posts";

const PAGE_SIZE = 10;

type PostsPageProps = {
  searchParams: Promise<{ tag?: string; page?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PostsPageProps): Promise<Metadata> {
  const { tag } = await searchParams;
  return {
    title: tag ? `标签：${tag}` : "文章",
  };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { tag, page: pageParam } = await searchParams;
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const all = await listPublishedPosts();
  const filtered = tag ? all.filter((post) => post.tags.includes(tag)) : all;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink">
        {tag ? `标签：${tag}` : "文章"}
      </h1>
      {tag ? (
        <p className="mt-3 text-sm text-muted">
          <Link href={postsHref()} className="text-pine hover:text-ink">
            查看全部文章
          </Link>
        </p>
      ) : null}

      {slice.length > 0 ? (
        <div className="mt-10 space-y-10">
          {slice.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState>
            {tag
              ? `没有带「${tag}」标签的已发布文章。`
              : "还没有已发布的文章。"}
          </EmptyState>
        </div>
      )}

      <Pagination page={currentPage} pageCount={pageCount} tag={tag} />
    </main>
  );
}
