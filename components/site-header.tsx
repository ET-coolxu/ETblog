import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { getSiteConfig } from "@/lib/site";
import styles from "./site-header.module.css";

/** 公开站顶栏：左站名，右导航贴着搜索与主题。固定在顶部，正文靠 layout 的上内边距让开。 */
export function SiteHeader() {
  const site = getSiteConfig();

  return (
    <header className={styles.header}>
      <div className={`shell ${styles.bar}`}>
        <Link href="/" className={styles.brand}>
          {site.name}
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
