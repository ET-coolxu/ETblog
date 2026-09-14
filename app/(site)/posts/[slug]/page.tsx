import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { TableOfContents } from "@/components/table-of-contents";
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
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <article>
        <header className="mx-auto max-w-3xl">
          <p className="text-sm text-muted">
            {formatPostDate(post.date)}
            <span aria-hidden="true"> · </span>
            约 {post.readingMinutes} 分钟阅读
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-snug text-ink sm:text-4xl">
            {post.title}
          </h1>
          {post.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link href={tagHref(tag)} className="text-pine hover:text-ink">
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {post.cover ? (
            <CoverImage
              src={post.cover}
              className="mt-8 max-h-72 w-full object-cover"
            />
          ) : null}
        </header>

        <div
          className={
            toc.length > 0
              ? "mt-12 lg:grid lg:grid-cols-[13rem_minmax(0,42rem)] lg:justify-center lg:gap-12"
              : "mx-auto mt-12 max-w-3xl"
          }
        >
          <TableOfContents items={toc} />
          <div className="markdown max-w-3xl">{content}</div>
        </div>
      </article>

      <nav
        aria-label="相邻文章"
        className="mx-auto mt-16 flex max-w-3xl flex-col gap-4 border-t border-rule pt-8 text-sm sm:flex-row sm:justify-between"
      >
        {adjacent.older ? (
          <Link href={`/posts/${adjacent.older.slug}`} className="text-muted hover:text-ink">
            <span className="block text-xs text-pine">上一篇</span>
            {adjacent.older.title}
          </Link>
        ) : (
          <span />
        )}
        {adjacent.newer ? (
          <Link
            href={`/posts/${adjacent.newer.slug}`}
            className="text-right text-muted hover:text-ink"
          >
            <span className="block text-xs text-pine">下一篇</span>
            {adjacent.newer.title}
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
