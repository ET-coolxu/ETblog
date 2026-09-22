import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { formatPostDate, tagHref, type PostMeta } from "@/lib/posts";

/**
 * 已发布文章列表卡。
 * compact：封面缩成小缩略图，避免和首页精选大图抢视线。
 */
export function PostCard({
  post,
  compact = false,
}: {
  post: PostMeta;
  compact?: boolean;
}) {
  return (
    <article className="border-l border-rule pl-6">
      {post.cover ? (
        <Link
          href={`/posts/${post.slug}`}
          className={compact ? "mb-3 block w-32" : "mb-3 block"}
        >
          <CoverImage
            src={post.cover}
            alt=""
            className={
              compact
                ? "h-20 w-32 rounded-md object-cover"
                : "max-h-40 w-full object-cover"
            }
          />
        </Link>
      ) : null}
      <p className="text-sm text-muted">{formatPostDate(post.date)}</p>
      <h2 className="mt-1 font-serif text-xl font-semibold leading-snug">
        <Link href={`/posts/${post.slug}`} className="hover:text-pine">
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-7 text-muted">{post.summary}</p>
      {post.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link href={tagHref(tag)} className="text-pine hover:text-ink">
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-muted">{children}</p>;
}
