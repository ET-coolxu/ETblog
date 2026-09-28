"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { TocItem } from "@/lib/markdown";

const ActiveIdContext = createContext<string | undefined>(undefined);

function useActiveHeading(items: TocItem[]) {
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
      // 上半屏里最靠上的标题算当前节。带太窄的话，短文滚到底时末节进不了高亮区。
      { rootMargin: "-20% 0px -45% 0px", threshold: 0.05 },
    );

    for (const heading of headings) {
      observer.observe(heading);
    }

    return () => observer.disconnect();
  }, [items]);

  return activeId;
}

function TocLinks({ items }: { items: TocItem[] }) {
  const activeId = useContext(ActiveIdContext);

  return (
    <ol className="space-y-2.5 font-label text-[0.8125rem] font-medium leading-5">
      {items.map((item) => {
        const active = item.id === activeId;

        return (
          <li key={item.id} className={item.depth === 3 ? "pl-3" : undefined}>
            <a
              href={`#${item.id}`}
              aria-current={active ? "location" : undefined}
              className={
                active
                  ? "flex items-center text-pine"
                  : "flex items-center text-muted transition-colors hover:text-ink"
              }
            >
              <span
                aria-hidden="true"
                className={
                  active
                    ? "mr-2.5 h-3.5 w-0.5 shrink-0 rounded-full bg-pine"
                    : "mr-2.5 h-3.5 w-0.5 shrink-0 rounded-full bg-transparent"
                }
              />
              <span className="truncate">{item.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 正文阅读栏与左侧目录的外壳。
 * xl 起三列：左右 1fr 配重，中间 760px 始终居中。目录在左列贴着阅读栏，不占正文宽度。
 * 高亮状态在这里观察一次，折叠目录与侧栏共用。
 */
export function PostReadingFrame({
  items,
  children,
}: {
  items: TocItem[];
  children: ReactNode;
}) {
  const activeId = useActiveHeading(items);

  return (
    <ActiveIdContext.Provider value={activeId}>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,760px)_minmax(0,1fr)] xl:items-start xl:gap-x-8">
        {items.length > 0 ? <TocRail items={items} /> : null}
        {/* 无目录时也要钉在中间列，否则唯一的网格项会落到左列 */}
        <div className="mx-auto w-full max-w-[760px] xl:col-start-2 xl:row-start-1 xl:mx-0">
          {children}
        </div>
      </div>
    </ActiveIdContext.Provider>
  );
}

/**
 * 窄屏目录。放在题头和正文之间；xl 起隐藏，避免和左侧栏重复。
 */
export function TocDetails({ items }: { items: TocItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <details className="mt-10 border-t border-rule pt-4 xl:hidden">
      <summary className="cursor-pointer font-label text-[0.8125rem] font-medium tracking-[0.04em] text-muted">
        目录
      </summary>
      <div className="mt-4">
        <TocLinks items={items} />
      </div>
    </details>
  );
}

/**
 * 宽屏目录。作为网格项 sticky，粘滞范围是与正文同一行的格子，能跟着正文滑。
 */
function TocRail({ items }: { items: TocItem[] }) {
  return (
    <aside className="sticky top-28 hidden w-[190px] justify-self-end self-start xl:col-start-1 xl:row-start-1 xl:block">
      <nav aria-label="文章目录" className="pt-2">
        <p className="mb-4 font-label text-[0.8125rem] font-medium tracking-[0.08em] text-muted">
          目录
        </p>
        <TocLinks items={items} />
      </nav>
    </aside>
  );
}
