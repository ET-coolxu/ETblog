import type { Metadata } from "next";
import Link from "next/link";
import { parsePageParam } from "@/components/pagination";
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
  getTodayUniqueVisitors,
  getTopPublishedPostViews,
  getTotalPageViews,
  getTotalUniqueVisitors,
  listPageVisits,
  type PageVisitRow,
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

const SLUG_PATTERN = /^[a-z0-9-]+$/;

type ArticleRow = {
  slug: string;
  title: string;
  date: string;
  status: AdminPostStatus;
  views: number;
};

type AdminStatsPageProps = {
  searchParams: Promise<{ page?: string }>;
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

/** 第 1 页不带 query，刷新后仍停在当前页。 */
function statsPageHref(page: number): string {
  return page <= 1 ? "/admin/stats" : `/admin/stats?page=${page}`;
}

/** 上海时区显示到分钟。无法解析时退回原字符串。 */
function formatVisitTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}`;
}

function fixedPageLabel(path: string): string | null {
  if (path === "/") {
    return "首页";
  }
  if (path === "/posts") {
    return "文章列表";
  }
  if (path === "/about") {
    return "关于";
  }
  return null;
}

function VisitPageCell({
  visit,
  postsBySlug,
}: {
  visit: PageVisitRow;
  postsBySlug: Map<string, AdminPost>;
}) {
  const fixed = fixedPageLabel(visit.path);
  if (fixed) {
    return fixed;
  }

  const post = visit.slug && SLUG_PATTERN.test(visit.slug) ? postsBySlug.get(visit.slug) : undefined;
  if (post && visit.slug) {
    return (
      <Link href={`/admin/posts/${visit.slug}`} className={styles.postTitle}>
        {post.title}
      </Link>
    );
  }

  return <span className={styles.muted}>{visit.path}</span>;
}

export default async function AdminStatsPage({ searchParams }: AdminStatsPageProps) {
  const { page: pageParam } = await searchParams;
  const [total, today, todayVisitors, totalVisitors, top, posts, counts, visits] = await Promise.all([
    getTotalPageViews(),
    getTodayPageViews(),
    getTodayUniqueVisitors(),
    getTotalUniqueVisitors(),
    getTopPublishedPostViews(10),
    listAdminPosts(),
    Promise.resolve(getAllPostViewCounts()),
    Promise.resolve(listPageVisits(parsePageParam(pageParam))),
  ]);
  const publishedCount = posts.filter((post) => adminPostStatus(post) === "published").length;
  const articles = posts.map((post) => toArticleRow(post, counts)).sort(compareArticleRows);
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>统计</h1>
      <p className={styles.intro}>
        总浏览和今日浏览只统计访客打开已发布正文。独立访客和访问记录还包括首页、文章列表和关于。管理员访问不计入。
      </p>

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
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>今日独立访客</p>
          <p className={styles.kpiValue}>{todayVisitors}</p>
        </div>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>累计独立访客</p>
          <p className={styles.kpiValue}>{totalVisitors}</p>
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

      <section className={styles.section}>
        <h2 className={styles.heading}>访问记录</h2>
        <p className={styles.credit}>
          <a href="https://db-ip.com">IP Geolocation by DB-IP</a>
        </p>
        {visits.rows.length > 0 ? (
          <>
            <div className={styles.scroll}>
              <table className={`${styles.table} ${styles.visitTable}`}>
                <thead>
                  <tr>
                    <th className={styles.headCell}>时间</th>
                    <th className={styles.headCell}>页面</th>
                    <th className={styles.headCell}>IP</th>
                    <th className={styles.headCell}>地区</th>
                    <th className={styles.headCell}>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.rows.map((visit) => (
                    <tr key={visit.id} className={styles.line}>
                      <td className={`${styles.cell} ${styles.muted}`}>{formatVisitTime(visit.visitedAt)}</td>
                      <td className={styles.cell}>
                        <VisitPageCell visit={visit} postsBySlug={postsBySlug} />
                      </td>
                      <td className={`${styles.cell} ${styles.ip}`}>{visit.ip}</td>
                      <td className={`${styles.cell} ${styles.place}`}>{visit.place || "未知"}</td>
                      <td className={`${styles.cell} ${styles.referrer}`} title={visit.referrer || undefined}>
                        {visit.referrer || "直接访问"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visits.pageCount > 1 ? (
              <nav className={styles.pager} aria-label="访问记录分页">
                {visits.page > 1 ? (
                  <Link href={statsPageHref(visits.page - 1)} className={styles.pagerLink}>
                    上一页
                  </Link>
                ) : (
                  <span className={styles.pagerDisabled}>上一页</span>
                )}
                <span className={styles.pagerStatus}>
                  {visits.page} / {visits.pageCount}
                </span>
                {visits.page < visits.pageCount ? (
                  <Link href={statsPageHref(visits.page + 1)} className={styles.pagerLink}>
                    下一页
                  </Link>
                ) : (
                  <span className={styles.pagerDisabled}>下一页</span>
                )}
              </nav>
            ) : null}
          </>
        ) : (
          <div className="mt-4">
            <EmptyState>还没有访问记录。</EmptyState>
          </div>
        )}
      </section>
    </main>
  );
}
