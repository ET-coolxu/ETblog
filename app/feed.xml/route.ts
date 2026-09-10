import { buildRssFeed } from "@/lib/feed";

export async function GET() {
  const xml = await buildRssFeed();
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}
