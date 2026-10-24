import type { Metadata } from "next";
import Link from "next/link";
import { PostReadingFrame, TocDetails } from "@/components/table-of-contents";
import { extractToc, renderMarkdown } from "@/lib/markdown";
import { formatPostDate, getLatestFleetPost, tagHref } from "@/lib/posts";
import styles from "./page.module.css";

/**
 * 舰队文章在运行时的 content 卷里，镜像构建时的预渲染不能当这一页的正文。
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const latest = await getLatestFleetPost();
  if (!latest) {
    return { title: "AI 助手舰队" };
  }

  return {
    title: "AI 助手舰队",
    description: latest.post.summary,
  };
}

export default async function FleetPage() {
  const latest = await getLatestFleetPost();

  if (!latest) {
    return (
      <main className={styles.main}>
        <PostReadingFrame items={[]}>
          <article>
            <header>
              <Link href="/columns" className={styles.back}>
                ← 专栏
              </Link>
              <h1 className={styles.title}>AI 助手舰队</h1>
            </header>
            <p className={styles.empty}>舰队介绍还在整理中。</p>
          </article>
        </PostReadingFrame>
      </main>
    );
  }

  const { post, botCount } = latest;
  const content = await renderMarkdown(post.body);
  const toc = extractToc(post.body);

  return (
    <main className={styles.main}>
      <PostReadingFrame items={toc}>
        <article>
          <header>
            <Link href="/columns" className={styles.back}>
              ← 专栏
            </Link>
            <p className={styles.meta}>
              <time dateTime={post.date}>更新于 {formatPostDate(post.date)}</time>
              <span className="quiet" aria-hidden="true">
                ·
              </span>
              <span>{botCount} 个 bot</span>
              <Link href={tagHref("舰队")} className={styles.tag}>
                舰队
              </Link>
            </p>
            <h1 className={styles.title}>AI 助手舰队</h1>
          </header>
          <TocDetails items={toc} />
          <div className={`markdown ${styles.body}`}>{content}</div>
          <footer className={styles.foot}>
            <p className={styles.hint}>每月更新一次，旧版本留在往期里。</p>
            <Link href={tagHref("舰队")} className={styles.more}>
              往期 →
            </Link>
          </footer>
        </article>
      </PostReadingFrame>
    </main>
  );
}
