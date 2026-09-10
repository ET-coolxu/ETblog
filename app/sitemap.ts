import type { MetadataRoute } from "next";
import { listPublishedPosts, listTags, tagHref } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags] = await Promise.all([listPublishedPosts(), listTags()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/posts"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/tags"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/search"), changeFrequency: "monthly", priority: 0.3 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/posts/${post.slug}`),
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((item) => ({
    url: absoluteUrl(tagHref(item.tag)),
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes];
}
