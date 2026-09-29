import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import { formatPostDate } from "@/lib/posts";
import {
  getTopPublishedPostViews,
  getTotalPageViews,
  listPublishedPostViews,
} from "@/lib/stats";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "访问统计",
};

export default async function AdminStatsPage() {
  const [total, top, all] = await Promise.all([
    getTotalPageViews(),
    getTopPublishedPostViews(10),
    listPublishedPostViews(),
  ]);

  return (
    <main className="page">
      <h1 className="doc-title">访问统计</h1>
      <p className={styles.intro}>仅统计访客打开已发布正文的次数，管理员访问不计入。</p>

      <p className={styles.total}>总浏览 {total} 次</p>

      <section className={styles.section}>
        <h2 className={styles.heading}>热门文章</h2>
        {top.length > 0 ? (
          <ol className={styles.rank}>
            {top.map((item, index) => (
              <li key={item.slug} className={styles.rankItem}>
                <span className={styles.rankMain}>
                  <span className={styles.index}>{index + 1}</span>
                  <Link href={`/posts/${item.slug}`} className={styles.title}>
                    {item.title}
                  </Link>
                </span>
                <span className={styles.count}>{item.views} 次</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-6">
            <EmptyState>还没有已发布文章的浏览记录。</EmptyState>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>各篇文章</h2>
        {all.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr className={styles.head}>
                <th className={styles.headCell}>文章</th>
                <th className={styles.headCell}>日期</th>
                <th className={`${styles.headCell} ${styles.right}`}>浏览</th>
              </tr>
            </thead>
            <tbody>
              {all.map((item) => (
                <tr key={item.slug} className={styles.line}>
                  <td className={styles.cell}>
                    <Link href={`/admin/posts/${item.slug}`} className={styles.title}>
                      {item.title}
                    </Link>
                  </td>
                  <td className={`muted ${styles.cell}`}>{formatPostDate(item.date)}</td>
                  <td className={`${styles.cell} ${styles.right}`}>{item.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-6">
            <EmptyState>还没有已发布的文章。</EmptyState>
          </div>
        )}
      </section>
    </main>
  );
}
