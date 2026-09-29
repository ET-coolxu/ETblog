import Link from "next/link";
import { getSiteConfig } from "@/lib/site";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  const site = getSiteConfig();

  return (
    <footer className={styles.footer}>
      <div className={`shell ${styles.inner}`}>
        <p className={styles.line}>
          <span>{site.author}</span>
          <span aria-hidden>·</span>
          <Link href="/feed.xml" className={styles.rss}>
            RSS
          </Link>
          <span aria-hidden>·</span>
          <span>© {new Date().getFullYear()}</span>
        </p>
        <p>Thoughtful, minimal reading</p>
      </div>
    </footer>
  );
}
