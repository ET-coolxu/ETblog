import type { Metadata } from "next";
import { POSTS_PAGE_SIZE, parsePageParam, slicePage } from "@/components/pagination";
import { PostFilterHeader, PostIndexView } from "@/components/post-index";
import { getPublishedPostsByTag, tagHref } from "@/lib/posts";

type TagPageProps = {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  return { title: `标签：${decodeURIComponent(tag)}` };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const [{ tag }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const decoded = decodeURIComponent(tag);
  const posts = await getPublishedPostsByTag(decoded);
  const { pageCount, currentPage, slice } = slicePage(posts, parsePageParam(pageParam), POSTS_PAGE_SIZE);

  return (
    <PostIndexView
      header={<PostFilterHeader tag={decoded} count={posts.length} />}
      posts={slice}
      activeTag={decoded}
      empty={`没有带「${decoded}」标签的已发布文章。`}
      page={currentPage}
      pageCount={pageCount}
      hrefFor={(nextPage) => tagPageHref(decoded, nextPage)}
    />
  );
}

/** 标签页翻页。第 1 页不带 query，避免 `/tags/x?page=1`。 */
function tagPageHref(tag: string, page: number): string {
  const path = tagHref(tag);
  return page > 1 ? `${path}?page=${page}` : path;
}
