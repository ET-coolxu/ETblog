import { HomeFeed } from "@/components/home-feed";
import { listPublishedPosts } from "@/lib/posts";

export default async function HomePage() {
  const posts = await listPublishedPosts();

  return (
    <main className="shell py-12">
      <HomeFeed posts={posts} />
    </main>
  );
}
