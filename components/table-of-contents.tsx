"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/markdown";

function TocList({
  items,
  activeId,
}: {
  items: TocItem[];
  activeId: string | undefined;
}) {
  return (
    <ol className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.id} className={item.depth === 3 ? "pl-4" : undefined}>
          <a
            href={`#${item.id}`}
            className={
              item.id === activeId
                ? "text-pine"
                : "text-muted hover:text-ink"
            }
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * 文章目录：窄屏折叠；宽屏作为阅读栏左侧的 sticky 网格子项。
 * 同时输出两份 DOM，用 `contents` 让它们各自参与正文页三列网格。
 */
export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);

    if (headings.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] },
    );

    for (const heading of headings) {
      observer.observe(heading);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  // contents：折叠目录与侧栏各自成为文章网格的子项，避免包一层后打乱列位置
  return (
    <div className="contents">
      <details className="mx-auto mt-12 mb-10 max-w-3xl border-l border-rule pl-4 xl:hidden">
        <summary className="cursor-pointer text-sm text-pine">目录</summary>
        <div className="mt-3">
          <TocList items={items} activeId={activeId} />
        </div>
      </details>
      <nav
        aria-label="文章目录"
        className="sticky top-24 mt-12 hidden w-52 justify-self-end self-start border-l border-rule pl-4 xl:col-start-1 xl:row-start-2 xl:block"
      >
        <p className="mb-3 text-xs tracking-wide text-pine">目录</p>
        <TocList items={items} activeId={activeId} />
      </nav>
    </div>
  );
}
