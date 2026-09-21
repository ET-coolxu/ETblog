import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { formatPostDate, tagHref, type PostMeta } from "@/lib/posts";

/**
 * 首页精选：全栏宽封面（若有）加标题与摘要。
 * 圆角、无阴影、纵向排列，避免杂志分栏或列表细卡片。
 */
export function FeaturedPost({ post }: { post: PostMeta }) {
  return (
    <article>
      {post.cover ? (
        <Link
          href={`/posts/${post.slug}`}
          className="block overflow-hidden rounded-lg"
        >
          <CoverImage
            src={post.cover}
            alt={post.title}
            className="aspect-[2/1] w-full object-cover"
          />
        </Link>
      ) : null}
      <p className={post.cover ? "mt-4 text-sm text-muted" : "text-sm text-muted"}>
        {formatPostDate(post.date)}
      </p>
      <h2 className="mt-1 font-serif text-2xl font-semibold leading-snug">
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
