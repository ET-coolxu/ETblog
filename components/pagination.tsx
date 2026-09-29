import Link from "next/link";
import styles from "./pagination.module.css";

/** 文章索引每页条数。`/posts` 与标签页共用。 */
export const POSTS_PAGE_SIZE = 10;

/**
 * 把 `?page=` 收成从 1 开始的页码。缺省、非数字或小于 1 时当作第 1 页。
 */
export function parsePageParam(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * 按页切开列表。页码超出时夹到最后一页，避免空切片。
 */
export function slicePage<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  return {
    pageCount,
    currentPage,
    slice: items.slice(start, start + pageSize),
  };
}

/**
 * 列表分页。只有一页时不渲染：没有可翻的页。
 * 两页及以上才显示，不可点的一侧用 dim 色。
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="文章分页"
      className={styles.nav}
    >
      <PageControl href={hrefFor(page - 1)} disabled={page <= 1} direction="prev" />
      <span className={styles.pages}>
        {page} / {pageCount}
      </span>
      <PageControl href={hrefFor(page + 1)} disabled={page >= pageCount} direction="next" />
    </nav>
  );
}

function PageControl({
  href,
  disabled,
  direction,
}: {
  href: string;
  disabled: boolean;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "上一页" : "下一页";
  const className = styles.control;

  if (disabled) {
    return (
      <span className={`${className} ${styles.disabled}`}>
        {direction === "prev" ? <Arrow direction={direction} /> : null}
        {label}
        {direction === "next" ? <Arrow direction={direction} /> : null}
      </span>
    );
  }

  return (
    <Link href={href} className={`${className} ${styles.link}`}>
      {direction === "prev" ? <Arrow direction={direction} /> : null}
      {label}
      {direction === "next" ? <Arrow direction={direction} /> : null}
    </Link>
  );
}

function Arrow({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path
        d={direction === "prev" ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
