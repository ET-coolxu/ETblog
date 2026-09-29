import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./layout.module.css";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={styles.frame}>
      <SiteHeader />
      <div className={styles.main}>{children}</div>
      <SiteFooter />
    </div>
  );
}
