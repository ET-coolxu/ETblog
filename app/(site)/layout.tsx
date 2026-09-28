import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {/* 纵向 flex，文章列表才能把稿面纸色铺满页眉和页脚之间 */}
      <div className="flex flex-1 flex-col pt-16">{children}</div>
      <SiteFooter />
    </div>
  );
}
