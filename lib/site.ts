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
    url: process.env.SITE_URL ?? "http://localhost:3000",
    intro: "这里是公开笔记。精选与最新文章会在下一阶段接上。",
  };
}
