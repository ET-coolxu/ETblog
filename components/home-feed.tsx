import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { EmptyState } from "@/components/post-card";
import { tagHref, type PostMeta } from "@/lib/posts";

const LATEST_LIMIT = 6;

/**
 * 首页信息流：精选导语在上，最新列表在下。
 * 调用方须传入已发布文章；已进精选的不会再出现在最新里。
 */
export function HomeFeed({ posts }: { posts: PostMeta[] }) {
  const featured = posts.filter((post) => post.featured);
  const featuredSlugs = new Set(featured.map((post) => post.slug));
  const latest = posts.filter((post) => !featuredSlugs.has(post.slug)).slice(0, LATEST_LIMIT);
  const [lead, ...restFeatured] = featured;

  if (posts.length === 0) {
    return <EmptyState>还没有已发布的文章。</EmptyState>;
  }

  return (
    <div className="flex flex-col">
      {lead ? (
        <section className="pb-12" aria-labelledby="featured-heading">
          <SectionHeading
            id="featured-heading"
            title="精选"
            count={`/ ${String(featured.length).padStart(2, "0")}`}
            kicker="Curated Essays"
          />
          <FeaturedLead post={lead} />
          {restFeatured.length > 0 ? (
            <div className="divide-y divide-rule">
              {restFeatured.map((post) => (
                <FeaturedItem key={post.slug} post={post} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={lead ? "pt-4" : undefined} aria-labelledby="latest-heading">
        <SectionHeading
          id="latest-heading"
          title="最新"
          count={`/ 全部 ${posts.length} 篇`}
          kicker="Chronological"
        />
        {latest.length > 0 ? (
          <div className="divide-y divide-rule">
            {latest.map((post) => (
              <LatestItem key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-muted">暂时没有更多已发布的文章。</p>
        )}
        <div className="mt-4 flex flex-col items-start justify-between gap-4 border-t border-rule pt-12 sm:flex-row sm:items-center">
          <p className="font-label text-[11px] font-semibold tracking-wide text-quiet">
            当前显示 {latest.length} / {posts.length} 篇
          </p>
          <Link
            href="/posts"
            className="inline-flex items-center gap-1 rounded-sm bg-chip px-4 py-1 font-label text-[13px] font-medium text-pine transition-colors hover:text-ink"
          >
            查看全部文章
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  id,
  title,
  count,
  kicker,
}: {
  id: string;
  title: string;
  count: string;
  kicker: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-4">
      <div className="flex items-baseline gap-1">
        <h2 id={id} className="font-serif text-2xl font-normal tracking-tight text-ink">
          {title}
        </h2>
        <span className="font-label text-[11px] font-semibold tracking-widest text-quiet">{count}</span>
      </div>
      <span className="font-label text-[11px] font-semibold tracking-widest text-quiet uppercase">
        {kicker}
      </span>
    </div>
  );
}

function FeaturedLead({ post }: { post: PostMeta }) {
  const href = `/posts/${post.slug}`;

  return (
    <article className="group border-b border-rule pt-7 pb-12">
      {post.cover ? (
        <Link href={href} className="mb-4 block overflow-hidden rounded-lg bg-chip">
          <CoverImage
            src={post.cover}
            alt=""
            className="aspect-21/9 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          />
        </Link>
      ) : null}
      <PostMetaLine post={post} />
      <h3 className="mt-2 font-serif text-3xl font-normal leading-tight tracking-tight text-ink transition-colors group-hover:text-pine">
        <Link href={href} className="decoration-rule underline-offset-4 hover:underline">
          {post.title}
        </Link>
      </h3>
      {post.summary ? (
        <p className="mt-3 text-base leading-relaxed text-muted">{post.summary}</p>
      ) : null}
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1 font-label text-[13px] font-medium text-pine hover:text-ink"
      >
        阅读全文
        <ArrowIcon />
      </Link>
    </article>
  );
}

function FeaturedItem({ post }: { post: PostMeta }) {
  const href = `/posts/${post.slug}`;

  return (
    <article className="group -mx-2 rounded-lg px-2 py-7 transition-colors hover:bg-chip/70">
      <PostMetaLine post={post} />
      <h3 className="mt-1 font-serif text-2xl font-normal leading-snug text-ink transition-colors group-hover:text-pine">
        <Link href={href}>{post.title}</Link>
      </h3>
      {post.summary ? (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{post.summary}</p>
      ) : null}
    </article>
  );
}

function LatestItem({ post }: { post: PostMeta }) {
  const href = `/posts/${post.slug}`;
  const tag = post.tags[0];

  return (
    <article className="group -mx-2 flex flex-col gap-2 rounded-lg px-2 py-7 transition-colors hover:bg-chip/70 sm:flex-row sm:gap-7">
      <div className="shrink-0 sm:w-32 sm:pt-1">
        <time dateTime={post.date} className="block font-label text-[11px] font-semibold tracking-wide text-quiet">
          {post.date}
        </time>
        {tag ? (
          <Link href={tagHref(tag)} className="mt-0.5 block font-label text-[11px] font-semibold text-pine hover:text-ink">
            {tag}
          </Link>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-xl font-medium leading-snug text-ink transition-colors group-hover:text-pine">
          <Link href={href}>{post.title}</Link>
        </h3>
        {post.summary ? (
          <p className="mt-1 text-sm leading-relaxed text-muted">{post.summary}</p>
        ) : null}
      </div>
    </article>
  );
}

function PostMetaLine({ post }: { post: PostMeta }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-label text-[11px] font-medium tracking-wide text-quiet">
      <time dateTime={post.date}>{editorialDate(post.date)}</time>
      {post.tags.length > 0 ? <span aria-hidden>·</span> : null}
      {post.tags.map((tag) => (
        <Link
          key={tag}
          href={tagHref(tag)}
          className="rounded-sm bg-chip px-1.5 py-0.5 font-medium text-pine hover:text-ink"
        >
          {tag}
        </Link>
      ))}
      <span aria-hidden>·</span>
      <span>{post.readingMinutes} 分钟阅读</span>
    </p>
  );
}

/** 首页 meta 用疏排中文日期；列表页仍走紧凑的 formatPostDate。 */
function editorialDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
