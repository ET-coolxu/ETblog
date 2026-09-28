import type { ReactNode } from "react";
import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { EmptyState } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { postsHref, tagHref, type PostMeta, type TagCount } from "@/lib/posts";

const pageTitleClass =
  "list-serif text-[2rem] font-normal leading-[2.625rem] tracking-[-0.015em] text-list-ink";

const chipLabel = "list-sans text-[11px] font-medium tracking-[0.04em]";

const chipClass = `${chipLabel} rounded-xs bg-list-chip px-2.5 py-1 leading-4 text-list-muted transition-colors hover:bg-list-chip-hover hover:text-list-ink`;

/** 日期和斜杠同一等宽字体，整行按基线对齐。标签字号更小，只补上侧 2px，芯片中线才和日期重合。 */
const metaText = "font-mono text-[13px] leading-none";

const pillClass = `${chipLabel} relative z-10 inline-block rounded-xs bg-list-chip px-1.5 pt-0.5 pb-0 leading-none text-list-muted transition-colors hover:text-list-ink`;

const activePillClass = `${chipLabel} relative z-10 inline-block rounded-xs bg-list-mint px-1.5 pt-0.5 pb-0 leading-none text-list-mint-ink`;

/**
 * 文章索引的一整页：页头、列表或空状态、分页。
 * `/posts` 与 `/tags/[tag]` 共用，不再按屏拆两套行样式。
 */
export function PostIndexView({
  header,
  posts,
  activeTag,
  empty,
  page,
  pageCount,
  hrefFor,
}: {
  header: ReactNode;
  posts: PostMeta[];
  activeTag?: string;
  empty: string;
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  return (
    <div className="flex flex-1 flex-col bg-list-surface">
      <main className="mx-auto w-full max-w-3xl px-5 py-10 md:px-4">
        {header}
        {posts.length > 0 ? (
          <PostIndexList posts={posts} activeTag={activeTag} />
        ) : (
          <div className="py-10">
            <EmptyState>{empty}</EmptyState>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
      </main>
    </div>
  );
}

/**
 * 全部文章页头：衬线题、ARCHIVE 计数、篇数，下面是分类芯片。
 * 芯片进入标签页；「全部」停在本页。
 */
export function PostIndexHeading({ count, tags }: { count: number; tags: TagCount[] }) {
  const archiveCount = String(count).padStart(2, "0");

  return (
    <div>
      <div className="pb-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className={pageTitleClass}>文章</h1>
          <span className="shrink-0 select-none font-mono text-[13px] leading-[22px] tracking-wider text-list-dim">
            ARCHIVE / {archiveCount}
          </span>
        </div>
        <p className="list-sans mt-1 text-[15px] leading-[26px] text-list-muted">{count} 篇记录</p>
      </div>
      <div className="mb-4 h-px bg-list-line" />
      <div className="mb-2 flex flex-wrap items-center gap-2 py-2">
        <span className="list-sans mr-1 text-[11px] font-medium leading-4 tracking-widest text-list-dim">
          分类
        </span>
        <span className={`${chipLabel} rounded-xs bg-list-ink px-2.5 py-1 leading-4 text-list-on-ink`}>
          全部 ({count})
        </span>
        {tags.map((item) => (
          <Link key={item.tag} href={tagHref(item.tag)} className={chipClass}>
            #{item.tag}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * 标签筛选页头。`/posts?tag=` 与 `/tags/[tag]` 共用。
 */
export function PostFilterHeader({ tag, count }: { tag: string; count: number }) {
  return (
    <div>
      <Link
        href={postsHref()}
        className="list-sans inline-flex items-center gap-1.5 text-[13px] font-medium leading-[18px] tracking-[0.02em] text-list-muted transition-colors hover:text-list-ink"
      >
        <BackIcon />
        查看全部文章
      </Link>
      <header className="mt-8 border-b border-list-line pb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
          <h1 className={pageTitleClass}>标签：{tag}</h1>
          <p className="list-sans text-[13px] font-medium leading-[18px] tracking-[0.02em] text-list-muted">
            包含此标签的文章共 {count} 篇
          </p>
        </div>
      </header>
    </div>
  );
}

function PostIndexList({ posts, activeTag }: { posts: PostMeta[]; activeTag?: string }) {
  return (
    <section aria-label="文章列表">
      {posts.map((post) => (
        <PostIndexItem key={post.slug} post={post} activeTag={activeTag} />
      ))}
    </section>
  );
}

function PostIndexItem({ post, activeTag }: { post: PostMeta; activeTag?: string }) {
  return (
    <article className="group relative flex flex-col gap-4 border-b border-list-line py-6 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1 sm:pr-4">
        <div className="mb-1 flex flex-wrap items-baseline gap-3">
          <time dateTime={post.date} className={`${metaText} text-list-muted`}>
            {post.date}
          </time>
          {post.tags.length > 0 ? (
            <>
              <span className={`${metaText} select-none text-list-dim`} aria-hidden>
                /
              </span>
              <ul className="m-0 inline-flex list-none items-baseline gap-1.5 p-0">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link href={tagHref(tag)} className={tag === activeTag ? activePillClass : pillClass}>
                      #{tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <h2 className="list-serif mb-1.5 text-xl font-medium leading-7 tracking-tight text-list-ink transition-colors group-hover:text-list-accent">
          {/* 伪元素铺满整行；标签链接 z-10，点标签不会进正文 */}
          <Link href={`/posts/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h2>
        {post.summary ? (
          <p className="list-sans line-clamp-2 text-[13px] leading-relaxed text-list-muted">{post.summary}</p>
        ) : null}
      </div>
      {post.cover ? <CoverThumb src={post.cover} /> : null}
    </article>
  );
}

/** 小封面。窄屏铺成 72px 高的通栏，宽屏改为 104×72。 */
function CoverThumb({ src }: { src: string }) {
  return (
    <div className="shrink-0 pt-1 sm:pt-0">
      <div className="h-[72px] w-full overflow-hidden rounded-xs border border-list-line bg-list-chip sm:w-[104px]">
        <CoverImage
          src={src}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
