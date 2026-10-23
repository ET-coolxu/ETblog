import type { Metadata } from "next";
import { getAboutSource } from "@/lib/posts";
import { AboutForm } from "./about-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "关于",
};

/** 后台编辑关于页。正文来自固定文件，页标题仍由公开页写成「关于」。 */
export default async function AdminAboutPage() {
  const source = await getAboutSource();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>关于</h1>
      <p className={styles.intro}>只改关于页正文。页标题仍是「关于」。</p>
      <AboutForm initialBody={source ?? ""} />
    </main>
  );
}
