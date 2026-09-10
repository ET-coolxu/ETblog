export type SiteConfig = {
  name: string;
  author: string;
  url: string;
  intro: string;
};

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
