import type { Metadata } from "next";
import { POSTS_PAGE_SIZE, parsePageParam, slicePage } from "@/components/pagination";
import { PostFilterHeader, PostIndexHeading, PostIndexView } from "@/components/post-index";
import { listPublishedPosts, listTags, postsHref } from "@/lib/posts";

type PostsPageProps = {
  searchParams: Promise<{ tag?: string; page?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PostsPageProps): Promise<Metadata> {
  const { tag } = await searchParams;
  return {
    title: tag ? `标签：${tag}` : "文章",
  };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { tag, page: pageParam } = await searchParams;
  const [all, tags] = await Promise.all([listPublishedPosts(), listTags()]);
  const filtered = tag ? all.filter((post) => post.tags.includes(tag)) : all;
  const { pageCount, currentPage, slice } = slicePage(filtered, parsePageParam(pageParam), POSTS_PAGE_SIZE);

  return (
    <PostIndexView
      header={
        tag ? (
          <PostFilterHeader tag={tag} count={filtered.length} />
        ) : (
          <PostIndexHeading count={all.length} tags={tags} />
        )
      }
      posts={slice}
      activeTag={tag}
      empty={tag ? `没有带「${tag}」标签的已发布文章。` : "还没有已发布的文章。"}
      page={currentPage}
      pageCount={pageCount}
      hrefFor={(nextPage) => postsHref({ page: nextPage, tag })}
    />
  );
}
