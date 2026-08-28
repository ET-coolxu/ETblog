import type { Metadata } from "next";
import { EmptyState, PostCard } from "@/components/post-card";
import { getPublishedPostsByTag } from "@/lib/posts";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return { title: decoded };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await getPublishedPostsByTag(decoded);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink">{decoded}</h1>
      {posts.length > 0 ? (
        <div className="mt-10 space-y-10">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState>没有带「{decoded}」标签的已发布文章。</EmptyState>
        </div>
      )}
    </main>
  );
}
