import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

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

export type TagCount = {
  tag: string;
  count: number;
};

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

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

function asCover(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cover = value.trim();
  if (!cover.startsWith("/") || cover.startsWith("//") || cover.includes("://")) {
    return undefined;
  }

  return cover;
}

function plainTextFromMarkdown(markdown: string): string {
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
): (PostMeta & { draft: boolean }) | null {
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
    readingMinutes: readingMinutesFromBody(body),
  };
}

async function readPostFile(
  slug: string,
): Promise<(Post & { draft: boolean }) | null> {
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

  const { draft, ...publicMeta } = meta;
  return {
    ...publicMeta,
    draft,
    body: parsed.content,
  };
}

async function listAllParsedPosts(): Promise<(Post & { draft: boolean })[]> {
  let names: string[];
  try {
    names = await fs.readdir(POSTS_DIR);
  } catch {
    return [];
  }

  const posts: (Post & { draft: boolean })[] = [];
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

export const listPublishedPosts = cache(async (): Promise<PostMeta[]> => {
  const posts = await listAllParsedPosts();
  return posts
    .filter((post) => !post.draft)
    .map(({ body: _body, draft: _draft, ...meta }) => meta);
});

export const getPublishedPost = cache(async (slug: string): Promise<Post | null> => {
  const post = await readPostFile(slug);
  if (!post || post.draft) {
    return null;
  }

  const { draft: _draft, ...published } = post;
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
