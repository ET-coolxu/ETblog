import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { PostReadingFrame, TocDetails } from "@/components/table-of-contents";
import { hasAdminSession } from "@/lib/auth";
import { extractToc, renderMarkdown } from "@/lib/markdown";
import {
  formatPostDate,
  getAdjacentPosts,
  getPublishedPost,
  tagHref,
} from "@/lib/posts";
import { recordPostView } from "@/lib/stats";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    return { title: "未找到" };
  }

  const images = post.cover ? [{ url: post.cover }] : undefined;

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: `${post.date}T00:00:00.000Z`,
      images,
    },
    twitter: {
      card: post.cover ? "summary_large_image" : "summary",
      title: post.title,
      description: post.summary,
      images,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    notFound();
  }

  const isAdmin = await hasAdminSession();
  after(() => {
    if (!isAdmin) {
      recordPostView(post.slug);
    }
  });

  const [content, adjacent] = await Promise.all([
    renderMarkdown(post.body),
    getAdjacentPosts(post.slug),
  ]);
  const toc = extractToc(post.body);

  return (
    <main className="w-full px-5 py-12 md:px-10">
      {/*
        阅读栏固定 760px 并居中。xl 起目录在左列，只占配重空白，不改变中间列宽度。
      */}
      <PostReadingFrame items={toc}>
        <article>
          <header>
            <p className="flex items-center gap-2 font-label text-[0.8125rem] font-medium leading-5 tracking-[0.04em] text-muted">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span className="text-quiet" aria-hidden="true">
                ·
              </span>
              <span>{post.readingMinutes} 分钟阅读</span>
            </p>
            <h1 className="mt-2 font-serif text-[1.75rem] font-normal leading-[2.35rem] tracking-[-0.01em] text-ink [font-optical-sizing:auto] md:text-[2.5rem] md:leading-[3.2rem] md:tracking-[-0.015em]">
              {post.title}
            </h1>
            {post.tags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap items-center gap-2 text-[0.6875rem] leading-4">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={tagHref(tag)}
                      className="inline-block rounded-xs bg-tag-bg px-2.5 py-0.5 font-label text-[0.6875rem] font-semibold leading-4 tracking-[0.08em] text-tag transition-colors hover:text-pine"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {post.cover ? (
              <div className="mt-7 aspect-video overflow-hidden rounded-lg bg-chip">
                <CoverImage
                  src={post.cover}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
          </header>

          <TocDetails items={toc} />

          <div className="markdown mt-12">{content}</div>

          <nav
            aria-label="相邻文章"
            className="mt-12 flex flex-col gap-4 pt-12 sm:flex-row sm:items-start sm:justify-between"
          >
            {adjacent.older ? (
              <Link
                href={`/posts/${adjacent.older.slug}`}
                className="group flex w-fit max-w-xs flex-col rounded p-2 transition-colors hover:bg-chip"
              >
                <span className="mb-1 block font-label text-[0.6875rem] font-semibold tracking-[0.08em] text-muted transition-colors group-hover:text-pine">
                  ← 上一篇
                </span>
                <span className="text-ink transition-colors group-hover:text-pine">
                  {adjacent.older.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {adjacent.newer ? (
              <Link
                href={`/posts/${adjacent.newer.slug}`}
                className="group flex w-fit max-w-xs flex-col self-end rounded p-2 text-right transition-colors hover:bg-chip"
              >
                <span className="mb-1 block font-label text-[0.6875rem] font-semibold tracking-[0.08em] text-muted transition-colors group-hover:text-pine">
                  下一篇 →
                </span>
                <span className="text-ink transition-colors group-hover:text-pine">
                  {adjacent.newer.title}
                </span>
              </Link>
            ) : null}
          </nav>
        </article>
      </PostReadingFrame>
    </main>
  );
}
