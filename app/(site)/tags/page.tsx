import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import { listTags, tagHref } from "@/lib/posts";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "标签",
};

export default async function TagsPage() {
  const tags = await listTags();

  return (
    <main className="page">
      <h1 className="doc-title">标签</h1>
      {tags.length > 0 ? (
        <ul className={styles.list}>
          {tags.map((item) => (
            <li key={item.tag} className={styles.row}>
              <Link href={tagHref(item.tag)} className={styles.name}>
                {item.tag}
              </Link>
              <span className={styles.count}>{item.count} 篇</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10">
          <EmptyState>还没有标签。</EmptyState>
        </div>
      )}
    </main>
  );
}
