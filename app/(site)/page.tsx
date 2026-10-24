import { HomeFeed } from "@/components/home-feed";
import { listPublishedPosts } from "@/lib/posts";
import { getHomeExcludeTags } from "@/lib/site";
import { trackPageVisit } from "@/lib/stats";

/**
 * 文章在运行时的 content 卷里，镜像构建时的预渲染不能当首页列表。
 * 与 /posts 一样按请求读盘，MCP 发文后不用再等一次后台访问才出现。
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await listPublishedPosts();
  await trackPageVisit({ kind: "home" });

  return (
    <main className="measure py-12">
      <HomeFeed posts={posts} excludeTags={getHomeExcludeTags()} />
    </main>
  );
}
