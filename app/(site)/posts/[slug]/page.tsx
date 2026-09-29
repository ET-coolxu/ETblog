import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { PostReadingFrame, TocDetails } from "@/components/table-of-contents";
import { hasAdminSession } from "@/lib/auth";
import { extractToc, renderMarkdown } from "@/lib/markdown";
import {
  formatPostDate,
  getAdjacentPosts,
  getPublishedPost,
  tagHref,
} from "@/lib/posts";
import { recordPostView } from "@/lib/stats";
import styles from "./page.module.css";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    return { title: "未找到" };
  }

  const images = post.cover ? [{ url: post.cover }] : undefined;

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: `${post.date}T00:00:00.000Z`,
      images,
    },
    twitter: {
      card: post.cover ? "summary_large_image" : "summary",
      title: post.title,
      description: post.summary,
      images,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    notFound();
  }

  const isAdmin = await hasAdminSession();
  after(() => {
    if (!isAdmin) {
      recordPostView(post.slug);
    }
  });

  const [content, adjacent] = await Promise.all([
    renderMarkdown(post.body),
    getAdjacentPosts(post.slug),
  ]);
  const toc = extractToc(post.body);

  return (
    <main className={styles.main}>
      <PostReadingFrame items={toc}>
        <article>
          <header>
            <p className={styles.meta}>
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span className="quiet" aria-hidden="true">
                ·
              </span>
              <span>{post.readingMinutes} 分钟阅读</span>
            </p>
            <h1 className={styles.title}>{post.title}</h1>
            {post.tags.length > 0 ? (
              <ul className={styles.tags}>
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link href={tagHref(tag)} className={styles.tag}>
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {post.cover ? (
              <div className={styles.cover}>
                <CoverImage src={post.cover} alt={post.title} className={styles.coverImage} />
              </div>
            ) : null}
          </header>

          <TocDetails items={toc} />

          <div className={`markdown ${styles.body}`}>{content}</div>

          <nav aria-label="相邻文章" className={styles.adjacent}>
            {adjacent.older ? (
              <Link href={`/posts/${adjacent.older.slug}`} className={styles.prev}>
                <span className={styles.jump}>← 上一篇</span>
                <span className={styles.jumpTitle}>{adjacent.older.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {adjacent.newer ? (
              <Link href={`/posts/${adjacent.newer.slug}`} className={styles.next}>
                <span className={styles.jump}>下一篇 →</span>
                <span className={styles.jumpTitle}>{adjacent.newer.title}</span>
              </Link>
            ) : null}
          </nav>
        </article>
      </PostReadingFrame>
    </main>
  );
}
