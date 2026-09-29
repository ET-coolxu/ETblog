import { requireAdminSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site";
import { AdminHeader } from "@/components/admin-header";
import styles from "./layout.module.css";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  const site = getSiteConfig();

  return (
    <div className={styles.frame}>
      <AdminHeader siteName={site.name} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
