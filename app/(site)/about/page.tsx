import type { Metadata } from "next";
import { EmptyState } from "@/components/post-card";
import { renderMarkdown } from "@/lib/markdown";
import { getAboutSource } from "@/lib/posts";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "关于",
};

/** 关于页。版式跟 stitch 关于稿，不套文章页的大标题和 meta。 */
export default async function AboutPage() {
  const source = await getAboutSource();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>关于</h1>
      {source ? (
        <div className={styles.prose}>{await renderMarkdown(source)}</div>
      ) : (
        <EmptyState>尚未填写关于页。</EmptyState>
      )}
    </main>
  );
}
