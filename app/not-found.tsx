import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "未找到",
};

export default function RootNotFound() {
  return (
    <div className={styles.frame}>
      <SiteHeader />
      <main className={`page-tall ${styles.main}`}>
        <h1 className="font-serif text-2xl">没有找到这个页面</h1>
        <p className={styles.lede}>可能是链接写错了，或这是一篇尚未发布的草稿。</p>
        <p className="mt-6">
          <Link href="/" className="link">
            回到首页
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
