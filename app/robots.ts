import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** 运行时读 SITE_URL，避免构建时把 sitemap 打成 localhost。 */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
