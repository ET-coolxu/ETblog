/**
 * 应用内 SQLite 浏览统计。
 * `post_views` 按 slug 累计；`daily_views` 按上海时区自然日累计。
 * 谁该被计入由调用方决定。删文只删该 slug 的累计行，不回退当日次数。
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { listPublishedPosts } from "@/lib/posts";

export type PostViewStat = {
  slug: string;
  title: string;
  date: string;
  views: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "stats.sqlite");

type StatsDatabase = Database.Database;

const globalForStats = globalThis as typeof globalThis & {
  statsDb?: StatsDatabase;
};

function getStatsDb(): StatsDatabase {
  if (!globalForStats.statsDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    globalForStats.statsDb = new Database(DB_PATH);
  }

  // 进程里若已有旧连接，仍补建日累计表，避免热更新后今日浏览写不进去。
  globalForStats.statsDb.exec(`
    CREATE TABLE IF NOT EXISTS post_views (
      slug TEXT PRIMARY KEY,
      views INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS daily_views (
      day TEXT PRIMARY KEY,
      views INTEGER NOT NULL
    );
  `);
  return globalForStats.statsDb;
}

/** 统计日界固定为 Asia/Shanghai 的自然日，不跟服务器本地时区走。 */
function shanghaiDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/**
 * 给 slug 的累计 PV 加 1，并给上海时区当天的日累计加 1。
 * 两步在同一事务里；失败只打日志，不抛给访客，也不留下写了一半的计数。
 */
export function recordPostView(slug: string): void {
  if (!slug) {
    return;
  }

  try {
    const db = getStatsDb();
    const day = shanghaiDate();
    db.transaction(() => {
      db.prepare(
        `
          INSERT INTO post_views (slug, views)
          VALUES (?, 1)
          ON CONFLICT(slug) DO UPDATE SET views = views + 1
        `,
      ).run(slug);
      db.prepare(
        `
          INSERT INTO daily_views (day, views)
          VALUES (?, 1)
          ON CONFLICT(day) DO UPDATE SET views = views + 1
        `,
      ).run(day);
    })();
  } catch (error) {
    console.error("记录访问统计失败", error);
  }
}

export function getTotalPageViews(): number {
  const row = getStatsDb()
    .prepare("SELECT COALESCE(SUM(views), 0) AS total FROM post_views")
    .get() as { total: number };
  return Number(row.total) || 0;
}

/**
 * 上海时区当天、按 `recordPostView` 成功写入的次数。
 * 上线前没有日累计，历史浏览不会回填。
 */
export function getTodayPageViews(): number {
  const row = getStatsDb()
    .prepare("SELECT views FROM daily_views WHERE day = ?")
    .get(shanghaiDate()) as { views: number } | undefined;
  return row?.views ?? 0;
}

export function getPostPageViews(slug: string): number {
  const row = getStatsDb()
    .prepare("SELECT views FROM post_views WHERE slug = ?")
    .get(slug) as { views: number } | undefined;
  return row?.views ?? 0;
}

/**
 * 一次读出 `post_views` 里全部 slug 的累计次数。
 * 没有记录的 slug 不在结果里，调用方按 0 处理。供后台列表拼接，避免按行查库。
 */
export function getAllPostViewCounts(): Map<string, number> {
  const rows = getStatsDb().prepare("SELECT slug, views FROM post_views").all() as {
    slug: string;
    views: number;
  }[];
  return new Map(rows.map((row) => [row.slug, row.views]));
}

export async function listPublishedPostViews(): Promise<PostViewStat[]> {
  const posts = await listPublishedPosts();
  const counts = getAllPostViewCounts();

  return posts
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      views: counts.get(post.slug) ?? 0,
    }))
    .sort((a, b) => {
      if (a.views === b.views) {
        return a.date < b.date ? 1 : -1;
      }

      return b.views - a.views;
    });
}

export async function getTopPublishedPostViews(limit = 10): Promise<PostViewStat[]> {
  const stats = await listPublishedPostViews();
  return stats.slice(0, limit);
}

/**
 * 删除指定 slug 的 PV 行。行不存在仍算成功；失败只打日志，不抛给调用方。
 * 不改 `daily_views`：当日已经发生的次数保留。
 */
export function deletePostViews(slug: string): void {
  if (!slug) {
    return;
  }

  try {
    getStatsDb().prepare("DELETE FROM post_views WHERE slug = ?").run(slug);
  } catch (error) {
    console.error("删除文章访问统计失败", error);
  }
}
