import { requireAdminSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site";
import { AdminSidebar } from "@/components/admin-sidebar";
import styles from "./layout.module.css";

export const dynamic = "force-dynamic";

/** 登录后的后台框：左栏导航，主区单独滚动。登录页不走这里。 */
export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  const site = getSiteConfig();

  return (
    <div className={styles.frame}>
      <AdminSidebar siteName={site.name} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
