import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { formatPostDate, tagHref, type PostMeta } from "@/lib/posts";
import styles from "./post-card.module.css";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className={styles.card}>
      {post.cover ? (
        <Link href={`/posts/${post.slug}`} className={styles.cover}>
          <CoverImage src={post.cover} className={styles.coverImage} />
        </Link>
      ) : null}
      <p className={styles.date}>{formatPostDate(post.date)}</p>
      <h2 className={styles.title}>
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className={styles.summary}>{post.summary}</p>
      {post.tags.length > 0 ? (
        <ul className={styles.tags}>
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link href={tagHref(tag)} className="link">
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
  return <p className="muted">{children}</p>;
}
