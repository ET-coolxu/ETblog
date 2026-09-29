import type { ReactNode } from "react";
import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { EmptyState } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { postsHref, tagHref, type PostMeta, type TagCount } from "@/lib/posts";
import styles from "./post-index.module.css";

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
    <div className={styles.page}>
      <main className={`shell ${styles.main}`}>
        {header}
        {posts.length > 0 ? (
          <PostIndexList posts={posts} activeTag={activeTag} />
        ) : (
          <div className={styles.empty}>
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
      <div className={styles.headingBlock}>
        <div className="spread">
          <h1 className={styles.pageTitle}>文章</h1>
          <span className={styles.archive}>ARCHIVE / {archiveCount}</span>
        </div>
        <p className={styles.count}>{count} 篇记录</p>
      </div>
      <div className="hairline mb-4" />
      <div className={styles.filters}>
        <span className={styles.filterLabel}>分类</span>
        <span className={styles.chipSolid}>全部 ({count})</span>
        {tags.map((item) => (
          <Link key={item.tag} href={tagHref(item.tag)} className={styles.chip}>
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
      <Link href={postsHref()} className={styles.back}>
        <BackIcon />
        查看全部文章
      </Link>
      <header className={styles.filterHead}>
        <div className="spread">
          <h1 className={styles.pageTitle}>标签：{tag}</h1>
          <p className={styles.filterCount}>包含此标签的文章共 {count} 篇</p>
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
    <article className={styles.item}>
      <div className={styles.body}>
        <div className={styles.metaRow}>
          <time dateTime={post.date} className={`${styles.meta} ${styles.date}`}>
            {post.date}
          </time>
          {post.tags.length > 0 ? (
            <>
              <span className={`${styles.meta} ${styles.dim}`} aria-hidden>
                /
              </span>
              <div className={styles.tags}>
                {post.tags.map((tag) => (
                  <Link key={tag} href={tagHref(tag)} className={tag === activeTag ? styles.pillActive : styles.pill}>
                    #{tag}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <h2 className={styles.title}>
          <Link href={`/posts/${post.slug}`} className={styles.stretch}>
            {post.title}
          </Link>
        </h2>
        {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
      </div>
      {post.cover ? <CoverThumb src={post.cover} /> : null}
    </article>
  );
}

/** 小封面。窄屏铺成 72px 高的通栏，宽屏改为 104×72。 */
function CoverThumb({ src }: { src: string }) {
  return (
    <div className={styles.thumbWrap}>
      <div className={styles.thumb}>
        <CoverImage src={src} alt="" className={styles.thumbImage} />
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
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
