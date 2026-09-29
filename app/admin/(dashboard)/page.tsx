import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import {
  adminPostStatus,
  formatPostDate,
  listAdminPosts,
  type AdminPostStatus,
} from "@/lib/posts";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "文章",
};

const STATUS_LABEL: Record<AdminPostStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已存档",
};

export default async function AdminHomePage() {
  const posts = await listAdminPosts();

  return (
    <main className="page">
      <div className={`spread ${styles.head}`}>
        <h1 className="doc-title">文章</h1>
        <div className={styles.actions}>
          <Link href="/admin/posts/new" className="link">
            写文章
          </Link>
          <Link href="/admin/stats" className="link-quiet">
            统计
          </Link>
        </div>
      </div>

      {posts.length > 0 ? (
        <ul className={`divided ${styles.list}`}>
          {posts.map((post) => {
            const status = adminPostStatus(post);
            return (
              <li key={post.slug} className={styles.row}>
                <div>
                  <Link href={`/admin/posts/${post.slug}`} className={styles.title}>
                    {post.title}
                  </Link>
                  <p className={styles.meta}>
                    {formatPostDate(post.date)}
                    <span aria-hidden="true"> · </span>
                    {post.slug}
                  </p>
                </div>
                <span className={status === "published" ? styles.published : styles.draft}>
                  {STATUS_LABEL[status]}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-10">
          <EmptyState>还没有文章。从「写文章」开始。</EmptyState>
        </div>
      )}
    </main>
  );
}
