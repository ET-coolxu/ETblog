import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/site";

export function generateMetadata(): Metadata {
  const site = getSiteConfig();
  return {
    title: {
      default: "后台",
      template: `%s · ${site.name}`,
    },
    robots: { index: false, follow: false },
  };
}

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
