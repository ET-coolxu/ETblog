import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import {
  adminPostStatus,
  formatPostDate,
  listAdminPosts,
  type AdminPostStatus,
} from "@/lib/posts";
import { getAllPostViewCounts } from "@/lib/stats";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "文章",
};

const STATUS_LABEL: Record<AdminPostStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "存档",
};

const FILTERS = [
  { value: "all", label: "全部", href: "/admin" },
  { value: "published", label: "已发布", href: "/admin?status=published" },
  { value: "draft", label: "草稿", href: "/admin?status=draft" },
  { value: "archived", label: "存档", href: "/admin?status=archived" },
] as const;

type StatusFilter = (typeof FILTERS)[number]["value"];

type AdminHomePageProps = {
  searchParams: Promise<{ status?: string }>;
};

/** 只认 published / draft / archived。缺省和其它值都当作全部，避免非法参数把页面打成 500。 */
function parseStatusFilter(value: string | undefined): StatusFilter {
  if (value === "published" || value === "draft" || value === "archived") {
    return value;
  }
  return "all";
}

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { status: rawStatus } = await searchParams;
  const filter = parseStatusFilter(rawStatus);
  const posts = await listAdminPosts();
  const counts = getAllPostViewCounts();
  const visible =
    filter === "all" ? posts : posts.filter((post) => adminPostStatus(post) === filter);

  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>文章</h1>
          <p className={styles.count}>{visible.length} 篇</p>
        </div>
        <Link href="/admin/posts/new" className={styles.write}>
          写文章
        </Link>
      </div>

      <div className={styles.filters} role="navigation" aria-label="按状态筛选">
        {FILTERS.map((item) => {
          const selected = filter === item.value;
          return (
            <Link
              key={item.value}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={selected ? `${styles.chip} ${styles.chipOn}` : styles.chip}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <div className="mt-8">
          <EmptyState>还没有文章。从「写文章」开始。</EmptyState>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState>这个状态下还没有文章。</EmptyState>
        </div>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.headCell}>标题</th>
                <th className={styles.headCell}>日期</th>
                <th className={styles.headCell}>slug</th>
                <th className={styles.headCell}>状态</th>
                <th className={`${styles.headCell} ${styles.right}`}>浏览</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((post) => {
                const status = adminPostStatus(post);
                const views = counts.get(post.slug) ?? 0;
                return (
                  <tr key={post.slug} className={styles.line}>
                    <td className={styles.cell}>
                      <Link href={`/admin/posts/${post.slug}`} className={styles.postTitle}>
                        {post.title}
                      </Link>
                    </td>
                    <td className={`${styles.cell} ${styles.muted}`}>{formatPostDate(post.date)}</td>
                    <td className={`${styles.cell} ${styles.slug}`}>{post.slug}</td>
                    <td className={styles.cell}>
                      <span className={`${styles.pill} ${styles[status]}`}>{STATUS_LABEL[status]}</span>
                    </td>
                    <td className={`${styles.cell} ${styles.right}`}>
                      {status === "draft" ? "—" : views}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
