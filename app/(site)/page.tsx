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
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <div className="border-l border-rule pl-8 sm:pl-10">
        <p className="text-sm tracking-wide text-pine">笔记</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-snug text-ink sm:text-4xl">
          {site.name}
        </h1>
        <p className="mt-5 max-w-prose text-base leading-8 text-muted">
          {site.intro}
        </p>
      </div>

      {featured.length > 0 ? (
        <section className="mt-16" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="font-serif text-lg text-ink">
            精选
          </h2>
          <div className="mt-6 space-y-10">
            {featured.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16" aria-labelledby="latest-heading">
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
