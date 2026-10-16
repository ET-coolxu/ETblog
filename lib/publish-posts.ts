/**
 * Publish API 的 JSON 组装与错误映射。
 * 不直接写磁盘：创建与更新都交给 savePost。
 */
import "server-only";
import {
  adminPostStatus,
  type AdminPost,
  type AdminPostStatus,
  type SavePostInput,
  type SavePostIntent,
} from "@/lib/posts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type PublishFailure = {
  ok: false;
  error: string;
  status: number;
};

export type PublishWriteSuccess = {
  ok: true;
  slug: string;
  status: AdminPostStatus;
  url: string;
};

/**
 * 上海当天日期。与统计里的「今日」同一时区，避免 UTC 在凌晨差一天。
 */
export function shanghaiToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function statusFromIntent(intent: SavePostIntent): AdminPostStatus {
  if (intent === "draft") {
    return "draft";
  }
  if (intent === "archive") {
    return "archived";
  }
  return "published";
}

/** 当前状态对应的保存意图。PATCH 省略 intent 时用它保持原状态。 */
export function intentFromStatus(status: AdminPostStatus): SavePostIntent {
  if (status === "draft") {
    return "draft";
  }
  if (status === "archived") {
    return "archive";
  }
  return "publish";
}

export function publishUrl(slug: string): string {
  return `/posts/${slug}`;
}

export function toWriteSuccess(slug: string, status: AdminPostStatus): PublishWriteSuccess {
  return { ok: true, slug, status, url: publishUrl(slug) };
}

/**
 * 把 savePost 的中文错误映成 HTTP 状态。
 * 找不到是 404，slug 冲突是 409，其余校验与状态机错误是 400。
 */
export function failureFromSaveError(error: string): PublishFailure {
  if (error === "找不到这篇文章。") {
    return { ok: false, error, status: 404 };
  }
  if (error === "这个 slug 已被使用。") {
    return { ok: false, error, status: 409 };
  }
  return { ok: false, error, status: 400 };
}

export function isPublishStatus(value: string): value is AdminPostStatus {
  return value === "published" || value === "draft" || value === "archived";
}

export type PostListItem = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  cover: string | null;
  featured: boolean;
  status: AdminPostStatus;
};

export type PostDetail = PostListItem & {
  body: string;
};

export function toListItem(post: AdminPost): PostListItem {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    summary: post.summary,
    cover: post.cover ?? null,
    featured: post.featured,
    status: adminPostStatus(post),
  };
}

export function toDetail(post: AdminPost): PostDetail {
  return {
    ...toListItem(post),
    body: post.body,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonObject(
  request: Request,
): Promise<{ ok: true; value: Record<string, unknown> } | PublishFailure> {
  try {
    const value: unknown = await request.json();
    if (!isRecord(value)) {
      return { ok: false, error: "请求体须为 JSON 对象。", status: 400 };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, error: "请求体须为 JSON 对象。", status: 400 };
  }
}

function readIntent(value: unknown): { ok: true; intent: SavePostIntent } | PublishFailure {
  if (value === "draft" || value === "publish" || value === "archive") {
    return { ok: true, intent: value };
  }
  return { ok: false, error: "未知操作。", status: 400 };
}

function readString(value: unknown, error: string): { ok: true; value: string } | PublishFailure {
  if (typeof value !== "string") {
    return { ok: false, error, status: 400 };
  }
  return { ok: true, value };
}

function readTags(value: unknown): { ok: true; tags: string[] } | PublishFailure {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    return { ok: false, error: "标签须为字符串数组。", status: 400 };
  }
  return {
    ok: true,
    tags: value.map((tag) => tag.trim()).filter(Boolean),
  };
}

function readFeatured(value: unknown): { ok: true; featured: boolean } | PublishFailure {
  if (typeof value !== "boolean") {
    return { ok: false, error: "精选须为布尔值。", status: 400 };
  }
  return { ok: true, featured: value };
}

function readDate(value: unknown): { ok: true; date: string } | PublishFailure {
  if (typeof value !== "string" || !DATE_PATTERN.test(value.trim())) {
    return { ok: false, error: "日期格式应为 YYYY-MM-DD。", status: 400 };
  }
  return { ok: true, date: value.trim() };
}

/**
 * 组装新建入参。slug 字段是手填段，由 savePost 在 create 模式下追加序号。
 * 调用方若自行传入 slug，直接拒绝，避免以为最终文件名已指定。
 */
export function inputForCreate(
  body: Record<string, unknown>,
): { ok: true; input: SavePostInput } | PublishFailure {
  if ("slug" in body) {
    return { ok: false, error: "新建不能指定完整 slug。", status: 400 };
  }
  if (!("slugHand" in body)) {
    return { ok: false, error: "请填写 slug。", status: 400 };
  }
  if (!("title" in body)) {
    return { ok: false, error: "标题不能为空。", status: 400 };
  }
  if (!("intent" in body)) {
    return { ok: false, error: "未知操作。", status: 400 };
  }

  const slugHand = readString(body.slugHand, "请填写 slug。");
  if (!slugHand.ok) {
    return slugHand;
  }
  const title = readString(body.title, "标题不能为空。");
  if (!title.ok) {
    return title;
  }
  const intent = readIntent(body.intent);
  if (!intent.ok) {
    return intent;
  }

  let date = shanghaiToday();
  if ("date" in body) {
    const parsed = readDate(body.date);
    if (!parsed.ok) {
      return parsed;
    }
    date = parsed.date;
  }

  let tags: string[] = [];
  if ("tags" in body) {
    const parsed = readTags(body.tags);
    if (!parsed.ok) {
      return parsed;
    }
    tags = parsed.tags;
  }

  let summary = "";
  if ("summary" in body) {
    const parsed = readString(body.summary, "摘要须为字符串。");
    if (!parsed.ok) {
      return parsed;
    }
    summary = parsed.value;
  }

  let cover = "";
  if ("cover" in body) {
    const parsed = readString(body.cover, "封面须为字符串。");
    if (!parsed.ok) {
      return parsed;
    }
    cover = parsed.value;
  }

  let featured = false;
  if ("featured" in body) {
    const parsed = readFeatured(body.featured);
    if (!parsed.ok) {
      return parsed;
    }
    featured = parsed.featured;
  }

  let markdown = "";
  if ("body" in body) {
    const parsed = readString(body.body, "正文须为字符串。");
    if (!parsed.ok) {
      return parsed;
    }
    markdown = parsed.value;
  }

  return {
    ok: true,
    input: {
      slug: slugHand.value,
      title: title.value,
      date,
      tags,
      summary,
      cover,
      featured,
      intent: intent.intent,
      body: markdown,
    },
  };
}

/**
 * 用磁盘上的现稿填上本次提交的字段。省略的字段保持原值；省略 intent 则保持当前状态。
 * storedSummary 是 frontmatter 里的手写摘要，不含正文摘录。
 * 路径中的 slug 才是文件名。正文里若出现另一个 slug 或 slugHand，拒绝写入。
 */
export function inputForUpdate(
  slug: string,
  current: AdminPost,
  storedSummary: string,
  body: Record<string, unknown>,
): { ok: true; input: SavePostInput } | PublishFailure {
  if ("slug" in body && body.slug !== slug) {
    return { ok: false, error: "创建后不可改 slug。", status: 400 };
  }
  if ("slugHand" in body) {
    return { ok: false, error: "创建后不可改 slug。", status: 400 };
  }

  let intent = intentFromStatus(adminPostStatus(current));
  if ("intent" in body) {
    const parsed = readIntent(body.intent);
    if (!parsed.ok) {
      return parsed;
    }
    intent = parsed.intent;
  }

  let title = current.title;
  if ("title" in body) {
    const parsed = readString(body.title, "标题不能为空。");
    if (!parsed.ok) {
      return parsed;
    }
    title = parsed.value;
  }

  let date = current.date;
  if ("date" in body) {
    const parsed = readDate(body.date);
    if (!parsed.ok) {
      return parsed;
    }
    date = parsed.date;
  }

  let tags = current.tags;
  if ("tags" in body) {
    const parsed = readTags(body.tags);
    if (!parsed.ok) {
      return parsed;
    }
    tags = parsed.tags;
  }

  let summary = storedSummary;
  if ("summary" in body) {
    const parsed = readString(body.summary, "摘要须为字符串。");
    if (!parsed.ok) {
      return parsed;
    }
    summary = parsed.value;
  }

  let cover = current.cover ?? "";
  if ("cover" in body) {
    const parsed = readString(body.cover, "封面须为字符串。");
    if (!parsed.ok) {
      return parsed;
    }
    cover = parsed.value;
  }

  let featured = current.featured;
  if ("featured" in body) {
    const parsed = readFeatured(body.featured);
    if (!parsed.ok) {
      return parsed;
    }
    featured = parsed.featured;
  }

  let markdown = current.body;
  if ("body" in body) {
    const parsed = readString(body.body, "正文须为字符串。");
    if (!parsed.ok) {
      return parsed;
    }
    markdown = parsed.value;
  }

  return {
    ok: true,
    input: {
      slug,
      title,
      date,
      tags,
      summary,
      cover,
      featured,
      intent,
      body: markdown,
    },
  };
}
