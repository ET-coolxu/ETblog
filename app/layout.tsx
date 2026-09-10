import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteConfig } from "@/lib/site";
import "./globals.css";

const sans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

const serif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});

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
      <body
        className={`${sans.variable} ${serif.variable} min-h-dvh bg-paper font-sans text-ink antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
