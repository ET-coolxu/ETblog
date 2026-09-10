import "server-only";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { listPublishedPostContents } from "@/lib/posts";
import { absoluteUrl, getSiteConfig } from "@/lib/site";

const FEED_LIMIT = 20;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

function absolutizeHtml(html: string, origin: string): string {
  return html.replace(/(src|href)="(\/[^"]*)"/g, (_, attr: string, pathname: string) => {
    return `${attr}="${origin}${pathname}"`;
  });
}

function rfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00.000Z`).toUTCString();
}

export async function buildRssFeed(): Promise<string> {
  const site = getSiteConfig();
  const posts = (await listPublishedPostContents()).slice(0, FEED_LIMIT);
  const items = await Promise.all(
    posts.map(async (post) => {
      const html = absolutizeHtml(await renderMarkdownToHtml(post.body), site.url);
      const url = absoluteUrl(`/posts/${post.slug}`);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <pubDate>${rfc822(post.date)}</pubDate>
      <description>${cdata(post.summary)}</description>
      <content:encoded>${cdata(html)}</content:encoded>
    </item>`;
    }),
  );

  const latest = posts[0]?.date ? rfc822(posts[0].date) : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${escapeXml(site.url)}</link>
    <description>${escapeXml(site.intro)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${latest}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;
}
