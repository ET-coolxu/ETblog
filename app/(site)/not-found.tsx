import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "未找到",
};

export default function SiteNotFound() {
  return (
    <main className="mx-auto w-full max-w-site px-4 py-24 sm:px-6">
      <h1 className="font-serif text-2xl text-ink">没有找到这个页面</h1>
      <p className="mt-4 leading-7 text-muted">
        可能是链接写错了，或这是一篇尚未发布的草稿。
      </p>
      <p className="mt-6">
        <Link href="/" className="text-pine hover:text-ink">
          回到首页
        </Link>
      </p>
    </main>
  );
}
