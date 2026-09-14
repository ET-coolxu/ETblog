import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { formatPostDate, tagHref, type PostMeta } from "@/lib/posts";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="border-l border-rule pl-6">
      {post.cover ? (
        <Link href={`/posts/${post.slug}`} className="mb-3 block">
          <CoverImage src={post.cover} className="max-h-40 w-full object-cover" />
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
