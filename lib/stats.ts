/**
 * 应用内 SQLite 浏览统计与访问记录。
 * `post_views` 按 slug 累计已发布正文；`daily_views` 按上海时区自然日累计今日浏览。
 * `page_visits` 记首页、文章列表、已发布正文和关于，并保存写入时解析出的地区。
 * 删文只删该 slug 的累计行，不回退当日次数，也不改已有访问记录。
 */
import "server-only";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import Database from "better-sqlite3";
import { after } from "next/server";
import { headers } from "next/headers";
import { hasAdminSession } from "@/lib/auth";
import { listPublishedPosts } from "@/lib/posts";

export type PostViewStat = {
  slug: string;
  title: string;
  date: string;
  views: number;
};

/** 一次要记的公开页。正文必须带已发布 slug。 */
export type TrackedPage =
  | { kind: "home" }
  | { kind: "posts" }
  | { kind: "about" }
  | { kind: "post"; slug: string };

export type PageVisitRow = {
  id: number;
  visitedAt: string;
  path: string;
  slug: string | null;
  ip: string;
  place: string;
  referrer: string;
};

export type PageVisitList = {
  page: number;
  pageCount: number;
  rows: PageVisitRow[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "stats.sqlite");
const VISIT_PAGE_SIZE = 20;
const REFERRER_MAX_LENGTH = 512;

type StatsDatabase = Database.Database;

type VisitInsert = {
  path: string;
  slug: string | null;
  ip: string;
  place: string;
  referrer: string | null;
};

type VisitDbRow = {
  id: number;
  visited_at: string;
  path: string;
  slug: string | null;
  ip: string;
  place: string | null;
  referrer: string;
};

const globalForStats = globalThis as typeof globalThis & {
  statsDb?: StatsDatabase;
};

function getStatsDb(): StatsDatabase {
  if (!globalForStats.statsDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    globalForStats.statsDb = new Database(DB_PATH);
  }

  // 热更新后的旧连接也要补上新表，并给连续打开几个页面留出等待锁的时间。
  globalForStats.statsDb.pragma("busy_timeout = 3000");
  globalForStats.statsDb.exec(`
    CREATE TABLE IF NOT EXISTS post_views (
      slug TEXT PRIMARY KEY,
      views INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS daily_views (
      day TEXT PRIMARY KEY,
      views INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS page_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visited_at TEXT NOT NULL,
      day TEXT NOT NULL,
      path TEXT NOT NULL,
      slug TEXT,
      ip TEXT NOT NULL,
      referrer TEXT NOT NULL DEFAULT '',
      place TEXT NOT NULL DEFAULT '未知'
    );
    CREATE INDEX IF NOT EXISTS page_visits_visited_at ON page_visits (visited_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS page_visits_day_ip ON page_visits (day, ip);
  `);
  ensurePlaceColumn(globalForStats.statsDb);
  return globalForStats.statsDb;
}

/**
 * 给已有的 `page_visits` 补上 `place` 列，默认「未知」。
 * 新库的建表语句里已经有这一列时直接返回。不读取地址库，也不改写旧行的其他字段。
 */
function ensurePlaceColumn(db: StatsDatabase): void {
  const columns = db.prepare("PRAGMA table_info(page_visits)").all() as { name: string }[];
  if (columns.some((column) => column.name === "place")) {
    return;
  }

  try {
    db.exec("ALTER TABLE page_visits ADD COLUMN place TEXT NOT NULL DEFAULT '未知'");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column/i.test(message)) {
      throw error;
    }
  }
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

function pathForTrackedPage(page: TrackedPage): string {
  switch (page.kind) {
    case "home":
      return "/";
    case "posts":
      return "/posts";
    case "about":
      return "/about";
    case "post":
      return `/posts/${page.slug}`;
  }
}

/**
 * 从请求头取出访客 IP。
 * 生产环境 Caddy 未配置 trusted_proxies，会丢掉客户端自带的 X-Forwarded-For，
 * 改写成它实际连上的地址。本机直接访问时该头为空，Next 会填入连接地址。
 * 头里若有多段，取最右侧，那是最近一层代理写上的地址。
 * `::ffff:` 开头的 IPv4 映射收成 IPv4，同一地址只算一个访客。无法解析时返回空字符串。
 */
function clientIpFromHeaders(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (!forwarded) {
    return "";
  }

  const parts = forwarded
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return normalizeIp(parts[parts.length - 1] ?? "");
}

function normalizeIp(raw: string): string {
  let value = raw.trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    value = value.slice(1, -1);
  }

  const zone = value.indexOf("%");
  if (zone >= 0) {
    value = value.slice(0, zone);
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice("::ffff:".length);
    if (net.isIP(mapped) === 4) {
      return mapped;
    }
  }

  if (net.isIP(value) === 4) {
    return value;
  }
  if (net.isIP(lower) === 6) {
    return lower;
  }
  return "";
}

/**
 * Next 的路由预取和浏览器 prefetch 都还没把页面打开，不记。
 * 真正点开时的客户端跳转会带 `rsc`，但不带 `next-router-prefetch`。
 */
function isPrefetchRequest(headerList: Headers): boolean {
  if (headerList.has("next-router-prefetch")) {
    return true;
  }

  const purpose = (headerList.get("purpose") ?? headerList.get("sec-purpose") ?? "").toLowerCase();
  return purpose.includes("prefetch");
}

function cleanReferrer(value: string | null): string {
  if (!value) {
    return "";
  }

  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!cleaned) {
    return "";
  }
  return cleaned.length > REFERRER_MAX_LENGTH ? cleaned.slice(0, REFERRER_MAX_LENGTH) : cleaned;
}

/**
 * 公开页成功打开之后记一次访问。调用前须已确认页面会正常打开，例如正文不存在时不要调用。
 * 带管理员 session 不记，预取也不记。cookie 和请求头在渲染期读取，再传入 after()；
 * Server Component 的 after 回调里不能再读这些请求数据。读取请求数据也会让该页按请求渲染。
 * 地区字符串在进入 after() 之前就算好：IP 属于请求数据，地址库是本地文件。
 * 解析失败时地区为「未知」，仍然调度 after()，避免把访问记录和正文浏览次数一起丢掉。
 * 已发布正文同时给累计浏览和当日浏览加 1。准备或写入失败只打日志，不抛给访客。
 */
export async function trackPageVisit(page: TrackedPage): Promise<void> {
  try {
    if (await hasAdminSession()) {
      return;
    }

    const headerList = await headers();
    if (isPrefetchRequest(headerList)) {
      return;
    }

    const ip = clientIpFromHeaders(headerList);
    const referrer = headerList.get("referer");
    let place = "未知";
    if (ip) {
      try {
        const { lookupPlace } = await import("@/lib/geo");
        place = await lookupPlace(ip);
      } catch (error) {
        console.error("解析地区失败", error);
      }
    }
    const visit: VisitInsert = {
      path: pathForTrackedPage(page),
      slug: page.kind === "post" ? page.slug : null,
      ip,
      place,
      referrer,
    };

    after(() => {
      if (page.kind === "post") {
        recordPostView(page.slug);
      }
      recordPageVisit(visit);
    });
  } catch (error) {
    console.error("准备访问记录失败", error);
  }
}

/**
 * 写入一行访问记录。IP 为空时跳过整行。来源过长会截断。地区沿用调用方已经算好的字符串。
 * 失败只打日志。不修改 `post_views` 或 `daily_views`。
 */
function recordPageVisit(visit: VisitInsert): void {
  if (!visit.ip || !visit.path) {
    console.error("访问记录缺少客户端 IP 或页面，已跳过");
    return;
  }

  try {
    const now = new Date();
    getStatsDb()
      .prepare(
        `
          INSERT INTO page_visits (visited_at, day, path, slug, ip, referrer, place)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        now.toISOString(),
        shanghaiDate(now),
        visit.path,
        visit.slug,
        visit.ip,
        cleanReferrer(visit.referrer),
        visit.place || "未知",
      );
  } catch (error) {
    console.error("记录访问失败", error);
  }
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

/** 上海时区当天，访问记录里不重复的 IP 数。上线前的访问不会回填。 */
export function getTodayUniqueVisitors(): number {
  const row = getStatsDb()
    .prepare("SELECT COUNT(DISTINCT ip) AS total FROM page_visits WHERE day = ?")
    .get(shanghaiDate()) as { total: number };
  return Number(row.total) || 0;
}

/** 访问记录里不重复的 IP 数。不随上海时区换日回退。 */
export function getTotalUniqueVisitors(): number {
  const row = getStatsDb()
    .prepare("SELECT COUNT(DISTINCT ip) AS total FROM page_visits")
    .get() as { total: number };
  return Number(row.total) || 0;
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

/**
 * 访问记录按时间从新到旧，每页 20 条。
 * 页码小于 1 时当作第 1 页；超出则夹到最后一页。没有记录时 `pageCount` 为 0。
 */
export function listPageVisits(page: number): PageVisitList {
  const db = getStatsDb();
  const totalRow = db.prepare("SELECT COUNT(*) AS total FROM page_visits").get() as { total: number };
  const total = Number(totalRow.total) || 0;
  if (total === 0) {
    return { page: 1, pageCount: 0, rows: [] };
  }

  const pageCount = Math.ceil(total / VISIT_PAGE_SIZE);
  const current = Math.min(Math.max(Math.floor(page) || 1, 1), pageCount);
  const offset = (current - 1) * VISIT_PAGE_SIZE;
  const rows = db
    .prepare(
      `
        SELECT id, visited_at, path, slug, ip, place, referrer
        FROM page_visits
        ORDER BY visited_at DESC, id DESC
        LIMIT ? OFFSET ?
      `,
    )
    .all(VISIT_PAGE_SIZE, offset) as VisitDbRow[];

  return {
    page: current,
    pageCount,
    rows: rows.map((row) => ({
      id: row.id,
      visitedAt: row.visited_at,
      path: row.path,
      slug: row.slug,
      ip: row.ip,
      place: row.place ?? "",
      referrer: row.referrer,
    })),
  };
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
 * 不改 `daily_views`，也不改 `page_visits`：当日次数和已有访问记录都保留。
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
