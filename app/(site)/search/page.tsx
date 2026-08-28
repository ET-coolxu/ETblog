import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "搜索",
};

export default function SearchPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink">搜索</h1>
      <p className="mt-6 leading-7 text-muted">搜索即将提供。</p>
    </main>
  );
}
