import { requireAdminSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site";
import { AdminHeader } from "@/components/admin-header";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  const site = getSiteConfig();

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader siteName={site.name} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
