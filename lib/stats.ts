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
  if (globalForStats.statsDb) {
    return globalForStats.statsDb;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS post_views (
      slug TEXT PRIMARY KEY,
      views INTEGER NOT NULL DEFAULT 0
    );
  `);
  globalForStats.statsDb = db;
  return db;
}

export function recordPostView(slug: string): void {
  if (!slug) {
    return;
  }

  try {
    getStatsDb()
      .prepare(
        `
          INSERT INTO post_views (slug, views)
          VALUES (?, 1)
          ON CONFLICT(slug) DO UPDATE SET views = views + 1
        `,
      )
      .run(slug);
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

export function getPostPageViews(slug: string): number {
  const row = getStatsDb()
    .prepare("SELECT views FROM post_views WHERE slug = ?")
    .get(slug) as { views: number } | undefined;
  return row?.views ?? 0;
}

export async function listPublishedPostViews(): Promise<PostViewStat[]> {
  const posts = await listPublishedPosts();
  const rows = getStatsDb()
    .prepare("SELECT slug, views FROM post_views")
    .all() as { slug: string; views: number }[];
  const counts = new Map(rows.map((row) => [row.slug, row.views]));

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
