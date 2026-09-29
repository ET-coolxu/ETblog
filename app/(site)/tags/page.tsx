import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import { listTags, tagHref } from "@/lib/posts";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "标签",
};

/** 标签总览。点 pill 进入 `/tags/{名}`，文章列表不在这一页展开。 */
export default async function TagsPage() {
  const tags = await listTags();

  return (
    <main className="page">
      <header className={styles.heading}>
        <h1 className={styles.title}>标签</h1>
        <p className={styles.total}>共 {tags.length} 个主题索引</p>
      </header>
      {tags.length > 0 ? (
        <ul className={styles.list}>
          {tags.map((item) => (
            <li key={item.tag}>
              <Link href={tagHref(item.tag)} className={styles.pill}>
                <span className={styles.name}>{item.tag}</span>
                <span className={styles.count}>
                  {item.count}
                  <span className="sr-only"> 篇</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>还没有标签。</EmptyState>
      )}
    </main>
  );
}
