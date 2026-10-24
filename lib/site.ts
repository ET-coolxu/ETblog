export type SiteConfig = {
  name: string;
  author: string;
  url: string;
  intro: string;
};

const DEFAULT_HOME_EXCLUDE_TAGS = ["Bot周报", "资讯", "舰队"];

/**
 * 首页「最新」要排除的标签。
 * 未设置 `HOME_EXCLUDE_TAGS` 时用默认清单；变量存在但去空白后为空则不排除。
 * 只给首页用。文章列表、标签页、搜索和 RSS 不读它。
 */
export function getHomeExcludeTags(): string[] {
  const raw = process.env.HOME_EXCLUDE_TAGS;
  if (raw === undefined) {
    return DEFAULT_HOME_EXCLUDE_TAGS;
  }

  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function getSiteConfig(): SiteConfig {
  return {
    name: process.env.SITE_NAME ?? "个人博客",
    author: process.env.AUTHOR_NAME ?? "作者",
    url: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    intro: "这里是公开笔记，按日期写下正在想的事情。",
  };
}

export function absoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteConfig().url}${path}`;
}
