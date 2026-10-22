import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { fontVariableClassName } from "@/app/fonts";
import { getSiteConfig } from "@/lib/site";
import "./globals.css";

export function generateMetadata(): Metadata {
  const site = getSiteConfig();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: site.name,
      template: `%s · ${site.name}`,
    },
    description: site.intro,
    alternates: {
      types: {
        "application/rss+xml": "/feed.xml",
      },
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: site.name,
      title: site.name,
      description: site.intro,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={fontVariableClassName}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
