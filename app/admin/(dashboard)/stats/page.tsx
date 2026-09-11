import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/post-card";
import { formatPostDate } from "@/lib/posts";
import {
  getTopPublishedPostViews,
  getTotalPageViews,
  listPublishedPostViews,
} from "@/lib/stats";

export const metadata: Metadata = {
  title: "访问统计",
};

export default async function AdminStatsPage() {
  const [total, top, all] = await Promise.all([
    getTotalPageViews(),
    getTopPublishedPostViews(10),
    listPublishedPostViews(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink">访问统计</h1>
      <p className="mt-4 text-sm text-muted">仅统计访客打开已发布正文的次数，管理员访问不计入。</p>

      <p className="mt-10 font-serif text-2xl text-ink">
        总浏览 {total} 次
      </p>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-ink">热门文章</h2>
        {top.length > 0 ? (
          <ol className="mt-6 space-y-4">
            {top.map((item, index) => (
              <li key={item.slug} className="flex items-baseline justify-between gap-4">
                <span>
                  <span className="mr-3 text-sm text-muted">{index + 1}</span>
                  <Link href={`/posts/${item.slug}`} className="hover:text-pine">
                    {item.title}
                  </Link>
                </span>
                <span className="shrink-0 text-sm text-muted">{item.views} 次</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-6">
            <EmptyState>还没有已发布文章的浏览记录。</EmptyState>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-ink">各篇文章</h2>
        {all.length > 0 ? (
          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-muted">
                <th className="py-2 font-normal">文章</th>
                <th className="py-2 font-normal">日期</th>
                <th className="py-2 text-right font-normal">浏览</th>
              </tr>
            </thead>
            <tbody>
              {all.map((item) => (
                <tr key={item.slug} className="border-b border-rule">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/posts/${item.slug}`} className="hover:text-pine">
                      {item.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted">{formatPostDate(item.date)}</td>
                  <td className="py-3 text-right tabular-nums">{item.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-6">
            <EmptyState>还没有已发布的文章。</EmptyState>
          </div>
        )}
      </section>
    </main>
  );
}
