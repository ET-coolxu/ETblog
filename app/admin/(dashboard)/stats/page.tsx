import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import {
  adminPostStatus,
  formatPostDate,
  listAdminPosts,
  type AdminPost,
  type AdminPostStatus,
} from "@/lib/posts";
import {
  getAllPostViewCounts,
  getTodayPageViews,
  getTopPublishedPostViews,
  getTotalPageViews,
} from "@/lib/stats";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "统计",
};

const STATUS_LABEL: Record<AdminPostStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "存档",
};

type ArticleRow = {
  slug: string;
  title: string;
  date: string;
  status: AdminPostStatus;
  views: number;
};

/** 有浏览数字的在前，按次数降序，相同则日期新的在前；草稿一律排在后面。 */
function compareArticleRows(a: ArticleRow, b: ArticleRow): number {
  const aDraft = a.status === "draft";
  const bDraft = b.status === "draft";
  if (aDraft !== bDraft) {
    return aDraft ? 1 : -1;
  }
  if (!aDraft && a.views !== b.views) {
    return b.views - a.views;
  }
  if (a.date === b.date) {
    return 0;
  }
  return a.date < b.date ? 1 : -1;
}

function toArticleRow(post: AdminPost, counts: Map<string, number>): ArticleRow {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    status: adminPostStatus(post),
    views: counts.get(post.slug) ?? 0,
  };
}

export default async function AdminStatsPage() {
  const [total, today, top, posts, counts] = await Promise.all([
    getTotalPageViews(),
    getTodayPageViews(),
    getTopPublishedPostViews(10),
    listAdminPosts(),
    Promise.resolve(getAllPostViewCounts()),
  ]);
  const publishedCount = posts.filter((post) => adminPostStatus(post) === "published").length;
  const articles = posts.map((post) => toArticleRow(post, counts)).sort(compareArticleRows);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>统计</h1>
      <p className={styles.intro}>仅统计访客打开已发布正文；管理员访问不计入。</p>

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>总浏览</p>
          <p className={styles.kpiValue}>{total}</p>
        </div>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>已发布篇数</p>
          <p className={styles.kpiValue}>{publishedCount}</p>
        </div>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>今日浏览</p>
          <p className={styles.kpiValue}>{today}</p>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.heading}>热门文章</h2>
        {top.length > 0 ? (
          <ol className={styles.rank}>
            {top.map((item, index) => (
              <li key={item.slug} className={styles.rankItem}>
                <span className={styles.index}>{index + 1}</span>
                <Link href={`/admin/posts/${item.slug}`} className={styles.postTitle}>
                  {item.title}
                </Link>
                <span className={styles.count}>{item.views}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4">
            <EmptyState>还没有已发布文章的浏览记录。</EmptyState>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>各篇文章</h2>
        {articles.length > 0 ? (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.headCell}>标题</th>
                  <th className={styles.headCell}>日期</th>
                  <th className={styles.headCell}>状态</th>
                  <th className={`${styles.headCell} ${styles.right}`}>浏览</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((item) => (
                  <tr key={item.slug} className={styles.line}>
                    <td className={styles.cell}>
                      <Link href={`/admin/posts/${item.slug}`} className={styles.postTitle}>
                        {item.title}
                      </Link>
                    </td>
                    <td className={`${styles.cell} ${styles.muted}`}>{formatPostDate(item.date)}</td>
                    <td className={styles.cell}>
                      <span className={`${styles.pill} ${styles[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td className={`${styles.cell} ${styles.right}`}>
                      {item.status === "draft" ? "—" : item.views}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState>还没有文章。</EmptyState>
          </div>
        )}
      </section>
    </main>
  );
}
