import Link from "next/link";
import { postsHref } from "@/lib/posts";

export function Pagination({
  page,
  pageCount,
  tag,
}: {
  page: number;
  pageCount: number;
  tag?: string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav aria-label="分页" className="mt-12 flex items-center gap-4 text-sm">
      {page > 1 ? (
        <Link href={postsHref({ page: page - 1, tag })} className="text-pine hover:text-ink">
          上一页
        </Link>
      ) : (
        <span className="text-muted/60">上一页</span>
      )}
      <span className="text-muted">
        第 {page} / {pageCount} 页
      </span>
      {page < pageCount ? (
        <Link href={postsHref({ page: page + 1, tag })} className="text-pine hover:text-ink">
          下一页
        </Link>
      ) : (
        <span className="text-muted/60">下一页</span>
      )}
    </nav>
  );
}
