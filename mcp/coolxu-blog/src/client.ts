/**
 * Publish API 的薄客户端。只转发 HTTP，不写本地 Markdown。
 */

export type PostStatus = "draft" | "published" | "archived";
export type SaveIntent = "draft" | "publish" | "archive";

export type CreatePostInput = {
  slugHand: string;
  title: string;
  intent: SaveIntent;
  date?: string;
  tags?: string[];
  summary?: string;
  cover?: string;
  featured?: boolean;
  body?: string;
};

export type UpdatePostInput = {
  slug: string;
  title?: string;
  intent?: SaveIntent;
  date?: string;
  tags?: string[];
  summary?: string;
  cover?: string;
  featured?: boolean;
  body?: string;
};

function requireEnv(name: "COOLXU_BLOG_BASE_URL" | "COOLXU_BLOG_TOKEN"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

function baseUrl(): string {
  return requireEnv("COOLXU_BLOG_BASE_URL").replace(/\/$/, "");
}

async function api(path: string, init?: { method?: string; body?: unknown }): Promise<unknown> {
  const token = requireEnv("COOLXU_BLOG_TOKEN");
  const response = await fetch(`${baseUrl()}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  if (!response.ok) {
    const error =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `HTTP ${response.status}`;
    throw new Error(error);
  }

  return payload;
}

/** 列出文章。status 省略时含草稿与存档。 */
export function listPosts(status?: PostStatus): Promise<unknown> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return api(`/api/v1/posts${query}`);
}

/** 读取一篇的后台视角，含正文。 */
export function getPost(slug: string): Promise<unknown> {
  return api(`/api/v1/posts/${encodeURIComponent(slug)}`);
}

/** 新建。服务端会把 slugHand 加成 `{手填}-{序号}`。 */
export function createPost(input: CreatePostInput): Promise<unknown> {
  return api("/api/v1/posts", { method: "POST", body: input });
}

/** 部分更新。只提交要改的字段；slug 放在路径里，不会被改写。 */
export function updatePost(input: UpdatePostInput): Promise<unknown> {
  const { slug, ...patch } = input;
  return api(`/api/v1/posts/${encodeURIComponent(slug)}`, { method: "PATCH", body: patch });
}
