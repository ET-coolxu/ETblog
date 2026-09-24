import { HomeFeed } from "@/components/home-feed";
import { listPublishedPosts } from "@/lib/posts";

export default async function HomePage() {
  const posts = await listPublishedPosts();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 md:px-4">
      <HomeFeed posts={posts} />
    </main>
  );
}
