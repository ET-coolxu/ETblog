import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import {
  adminPostStatus,
  formatPostDate,
  listAdminPosts,
  type AdminPostStatus,
} from "@/lib/posts";

export const metadata: Metadata = {
  title: "文章",
};

const STATUS_LABEL: Record<AdminPostStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已存档",
};

export default async function AdminHomePage() {
  const posts = await listAdminPosts();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold text-ink">文章</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/posts/new" className="text-pine hover:text-ink">
            写文章
          </Link>
          <Link href="/admin/stats" className="text-muted hover:text-ink">
            统计
          </Link>
        </div>
      </div>

      {posts.length > 0 ? (
        <ul className="mt-10 divide-y divide-rule">
          {posts.map((post) => {
            const status = adminPostStatus(post);
            return (
              <li key={post.slug} className="flex flex-wrap items-baseline justify-between gap-3 py-5">
                <div>
                  <Link
                    href={`/admin/posts/${post.slug}`}
                    className="font-serif text-xl font-semibold text-ink hover:text-pine"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {formatPostDate(post.date)}
                    <span aria-hidden="true"> · </span>
                    {post.slug}
                  </p>
                </div>
                <span
                  className={status === "published" ? "text-sm text-pine" : "text-sm text-muted"}
                >
                  {STATUS_LABEL[status]}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-10">
          <EmptyState>还没有文章。从「写文章」开始。</EmptyState>
        </div>
      )}
    </main>
  );
}
