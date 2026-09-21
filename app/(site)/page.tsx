import { FeaturedPost } from "@/components/featured-post";
import { PostCard } from "@/components/post-card";
import { getSiteConfig } from "@/lib/site";
import { listPublishedPosts } from "@/lib/posts";

export default async function HomePage() {
  const site = getSiteConfig();
  const posts = await listPublishedPosts();
  const featured = posts.filter((post) => post.featured);
  const featuredSlugs = new Set(featured.map((post) => post.slug));
  const latest = posts.filter((post) => !featuredSlugs.has(post.slug)).slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8 sm:pb-20">
      <h1 className="sr-only">{site.name}</h1>

      {featured.length > 0 ? (
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="sr-only">
            精选
          </h2>
          <div className="space-y-12">
            {featured.map((post) => (
              <FeaturedPost key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      <section
        className={featured.length > 0 ? "mt-14" : undefined}
        aria-labelledby="latest-heading"
      >
        <h2 id="latest-heading" className="font-serif text-lg text-ink">
          最新
        </h2>
        {latest.length > 0 ? (
          <div className="mt-6 space-y-10">
            {latest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-muted">
            {featured.length > 0
              ? "暂时没有更多已发布的文章。"
              : "还没有已发布的文章。"}
          </p>
        )}
      </section>
    </main>
  );
}
