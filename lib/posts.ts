/**
 * 文章 Markdown 的读写：公开侧只认已发布，后台可读草稿与存档。
 * 状态只存在 frontmatter，不另存数据库。
 */
import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { asCover } from "@/lib/cover";

export { asCover };

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const ABOUT_FILE = path.join(process.cwd(), "content", "pages", "about.md");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  cover?: string;
  featured: boolean;
  readingMinutes: number;
};

export type Post = PostMeta & {
  body: string;
};

export type AdminPostStatus = "draft" | "published" | "archived";

export type AdminPost = Post & {
  draft: boolean;
  archived: boolean;
};

/** 磁盘解析结果，含草稿与存档标记；公开列表须再过滤。 */
type ParsedPost = AdminPost;

export type SavePostIntent = "draft" | "publish" | "archive";

export type SavePostInput = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  cover: string;
  featured: boolean;
  intent: SavePostIntent;
  body: string;
};

export type SavePostResult = { ok: true; slug: string } | { ok: false; error: string };

export type TagCount = {
  tag: string;
  count: number;
};

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/**
 * 把合法 slug 解析成 `content/posts/{slug}.md` 的绝对路径。
 * 非法字符或路径穿越时返回 null，禁止读写目录外的文件。
 */
function resolvePostFile(slug: string): string | null {
  if (!isValidSlug(slug)) {
    return null;
  }

  const filePath = path.resolve(POSTS_DIR, `${slug}.md`);
  const relative = path.relative(POSTS_DIR, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return filePath;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((tag): tag is string => typeof tag === "string" && tag.trim() !== "")
    .map((tag) => tag.trim());
}

function asDate(value: unknown): string | undefined {
  if (typeof value === "string" && DATE_PATTERN.test(value)) {
    return value;
  }

  // gray-matter / YAML 会把 2026-08-26 解析成 Date
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return undefined;
}

export function plainTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptFromBody(body: string, maxChars = 120): string {
  const text = plainTextFromMarkdown(body);
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars).trimEnd()}…`;
}

export function readingMinutesFromBody(body: string): number {
  const chars = plainTextFromMarkdown(body).replace(/\s/g, "").length;
  return Math.max(1, Math.round(chars / 300) || 1);
}

export function formatPostDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function toMeta(
  slug: string,
  data: Record<string, unknown>,
  body: string,
): (PostMeta & { draft: boolean; archived: boolean }) | null {
  const title = asString(data.title);
  const date = asDate(data.date);
  if (!title || !date) {
    return null;
  }

  const summary = asString(data.summary) ?? excerptFromBody(body);

  return {
    slug,
    title,
    date,
    tags: asTags(data.tags),
    summary,
    cover: asCover(data.cover),
    featured: asBoolean(data.featured),
    draft: asBoolean(data.draft),
    archived: asBoolean(data.archived),
    readingMinutes: readingMinutesFromBody(body),
  };
}

/**
 * 三选一状态。两字段同时为 true 时按存档处理（后台显示已存档，对外不可见）。
 */
export function adminPostStatus(post: {
  draft: boolean;
  archived: boolean;
}): AdminPostStatus {
  if (post.archived) {
    return "archived";
  }
  if (post.draft) {
    return "draft";
  }
  return "published";
}

/** 公开侧只认非草稿且非存档；两字段都为 true 时也不公开。 */
function isPubliclyListed(post: { draft: boolean; archived: boolean }): boolean {
  return !post.draft && !post.archived;
}

async function readPostFile(slug: string): Promise<ParsedPost | null> {
  const filePath = resolvePostFile(slug);
  if (!filePath) {
    return null;
  }

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }

  const parsed = matter(raw);
  const meta = toMeta(slug, parsed.data, parsed.content);
  if (!meta) {
    return null;
  }

  const { draft, archived, ...publicMeta } = meta;
  return {
    ...publicMeta,
    draft,
    archived,
    body: parsed.content,
  };
}

async function listAllParsedPosts(): Promise<ParsedPost[]> {
  let names: string[];
  try {
    names = await fs.readdir(POSTS_DIR);
  } catch {
    return [];
  }

  const posts: ParsedPost[] = [];
  for (const name of names) {
    if (!name.endsWith(".md")) {
      continue;
    }

    const slug = name.slice(0, -3);
    const post = await readPostFile(slug);
    if (post) {
      posts.push(post);
    }
  }

  return posts.sort((a, b) => {
    if (a.date === b.date) {
      return a.slug.localeCompare(b.slug);
    }

    return a.date < b.date ? 1 : -1;
  });
}

/**
 * 已发布文章全文（非草稿且非存档）。搜索、RSS 等公开聚合走这里。
 */
export const listPublishedPostContents = cache(async (): Promise<Post[]> => {
  const posts = await listAllParsedPosts();
  return posts
    .filter(isPubliclyListed)
    .map(({ draft: _draft, archived: _archived, ...post }) => post);
});

/**
 * 已发布文章元数据。首页、列表、标签、sitemap 走这里，不含草稿与存档。
 */
export const listPublishedPosts = cache(async (): Promise<PostMeta[]> => {
  const posts = await listPublishedPostContents();
  return posts.map(({ body: _body, ...meta }) => meta);
});

/**
 * 按 slug 读取已发布文章。草稿、存档或不存在时返回 null（访客侧应 404）。
 */
export const getPublishedPost = cache(async (slug: string): Promise<Post | null> => {
  const post = await readPostFile(slug);
  if (!post || !isPubliclyListed(post)) {
    return null;
  }

  const { draft: _draft, archived: _archived, ...published } = post;
  return published;
});

export async function getAdjacentPosts(
  slug: string,
): Promise<{ newer: PostMeta | null; older: PostMeta | null }> {
  const posts = await listPublishedPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index < 0) {
    return { newer: null, older: null };
  }

  return {
    newer: index > 0 ? posts[index - 1] : null,
    older: index < posts.length - 1 ? posts[index + 1] : null,
  };
}

export async function listTags(): Promise<TagCount[]> {
  const posts = await listPublishedPosts();
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag, "zh-CN"));
}

export async function getPublishedPostsByTag(tag: string): Promise<PostMeta[]> {
  const posts = await listPublishedPosts();
  return posts.filter((post) => post.tags.includes(tag));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** 后台文章列表，含草稿、已发布与已存档。 */
export const listAdminPosts = cache(async (): Promise<AdminPost[]> => {
  return listAllParsedPosts();
});

/** 后台读取单篇，含草稿与存档；不存在或无法解析时返回 null。 */
export const getAdminPost = cache(async (slug: string): Promise<AdminPost | null> => {
  return readPostFile(slug);
});

const SLUG_NUMERIC_SUFFIX = /-(\d+)$/;

/**
 * 扫描 `content/posts/*.md` 文件名，取尾部 `-{数字}` 的最大值加一。
 * 没有带数字后缀的旧文不占用序号；没有则从 1 起。不另建 ID 表。
 */
export async function nextPostNumericId(): Promise<number> {
  let names: string[];
  try {
    names = await fs.readdir(POSTS_DIR);
  } catch {
    return 1;
  }

  let max = 0;
  for (const name of names) {
    if (!name.endsWith(".md")) {
      continue;
    }

    const match = name.slice(0, -3).match(SLUG_NUMERIC_SUFFIX);
    if (!match) {
      continue;
    }

    const n = Number(match[1]);
    if (Number.isSafeInteger(n) && n > max) {
      max = n;
    }
  }

  return max + 1;
}

/**
 * 把作者手填的 slug 接上全站下一序号，得到 `{hand}-{n}`。
 * 仅用于新建首次保存；不按前缀试探空闲名，也不改已有文件名。
 */
export async function allocateCreateSlug(
  hand: string,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const trimmed = hand.trim().toLowerCase();
  if (!isValidSlug(trimmed)) {
    return { ok: false, error: "slug 只能包含小写字母、数字和连字符。" };
  }
  if (trimmed === "new") {
    return { ok: false, error: "slug 不能使用 new。" };
  }

  let n = await nextPostNumericId();
  // 若 {hand}-{n} 恰好已存在，继续加一，仍走全站序号而不是按前缀试探
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const slug = `${trimmed}-${n}`;
    const filePath = resolvePostFile(slug);
    if (!filePath) {
      return { ok: false, error: "slug 不合法。" };
    }
    if (!(await fileExists(filePath))) {
      return { ok: true, slug };
    }
    n += 1;
  }

  return { ok: false, error: "无法分配可用的 slug 序号。" };
}

/**
 * 按当前磁盘状态校验保存意图。
 * 禁止已存档直接发布、草稿存档；新建视同草稿。
 */
function assertSaveTransition(
  current: AdminPostStatus | null,
  intent: SavePostIntent,
): { ok: true } | { ok: false; error: string } {
  const status = current ?? "draft";
  if (status === "archived" && intent === "publish") {
    return { ok: false, error: "请先改为草稿再发布。" };
  }
  if (status === "draft" && intent === "archive") {
    return { ok: false, error: "草稿不能存档。" };
  }
  return { ok: true };
}

/**
 * 把文章写入 `content/posts/{slug}.md`。
 * 新建时把手填 slug 追加全站序号；更新不改文件名、不重新编号。
 * 按意图写入三选一状态：发布两者都不写，草稿只写 draft，存档只写 archived。
 */
export async function savePost(
  input: SavePostInput,
  mode: "create" | "update",
): Promise<SavePostResult> {
  let slug = input.slug.trim().toLowerCase();

  if (mode === "create") {
    const allocated = await allocateCreateSlug(slug);
    if (!allocated.ok) {
      return allocated;
    }
    slug = allocated.slug;
  } else if (!isValidSlug(slug)) {
    return { ok: false, error: "slug 只能包含小写字母、数字和连字符。" };
  } else if (slug === "new") {
    return { ok: false, error: "slug 不能使用 new。" };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "标题不能为空。" };
  }

  const date = input.date.trim();
  if (!DATE_PATTERN.test(date)) {
    return { ok: false, error: "日期格式应为 YYYY-MM-DD。" };
  }

  const filePath = resolvePostFile(slug);
  if (!filePath) {
    return { ok: false, error: "slug 不合法。" };
  }

  const exists = await fileExists(filePath);
  if (mode === "create" && exists) {
    return { ok: false, error: "这个 slug 已被使用。" };
  }
  if (mode === "update" && !exists) {
    return { ok: false, error: "找不到这篇文章。" };
  }

  let currentStatus: AdminPostStatus | null = null;
  if (mode === "update") {
    const current = await readPostFile(slug);
    if (!current) {
      return { ok: false, error: "找不到这篇文章。" };
    }
    currentStatus = adminPostStatus(current);
  }

  const transition = assertSaveTransition(currentStatus, input.intent);
  if (!transition.ok) {
    return transition;
  }

  const data: Record<string, unknown> = {
    title,
    date,
    tags: input.tags,
  };
  const summary = input.summary.trim();
  if (summary) {
    data.summary = summary;
  }
  const rawCover = input.cover.trim();
  const cover = asCover(rawCover);
  if (rawCover && !cover) {
    return { ok: false, error: "封面须为站内路径或 https 地址。" };
  }
  if (cover) {
    data.cover = cover;
  }
  if (input.featured) {
    data.featured = true;
  }
  // 禁止一次写入两个 true：发布两者都不写，草稿/存档只写对应字段
  if (input.intent === "draft") {
    data.draft = true;
  } else if (input.intent === "archive") {
    data.archived = true;
  }

  const body = input.body.replace(/^\uFEFF/, "").replace(/\s+$/, "");
  const markdown = matter.stringify(`${body}\n`, data);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, markdown, "utf8");
  return { ok: true, slug };
}

/**
 * 删除 `content/posts/{slug}.md`。
 * 确认路径在文章目录内后 unlink；找不到文件返回中文错误。不删上传图片。
 */
export async function deletePost(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const filePath = resolvePostFile(slug);
  if (!filePath) {
    return { ok: false, error: "slug 不合法。" };
  }

  try {
    await fs.unlink(filePath);
    return { ok: true };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { ok: false, error: "找不到这篇文章。" };
    }
    return { ok: false, error: "删除文章失败。" };
  }
}

export const getAboutSource = cache(async (): Promise<string | null> => {
  try {
    return await fs.readFile(ABOUT_FILE, "utf8");
  } catch {
    return null;
  }
});

export function tagHref(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}`;
}

export function postsHref(options: { page?: number; tag?: string } = {}): string {
  const params = new URLSearchParams();
  if (options.tag) {
    params.set("tag", options.tag);
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}
