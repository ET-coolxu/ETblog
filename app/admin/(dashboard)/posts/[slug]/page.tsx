import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deletePostAction, updatePostAction } from "@/app/admin/(dashboard)/posts/actions";
import { PostEditor } from "@/components/post-editor";
import { adminPostStatus, getAdminPost } from "@/lib/posts";

type EditPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: EditPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getAdminPost(slug);
  return {
    title: post ? `编辑：${post.title}` : "未找到",
  };
}

/** 编辑已有文章。标题和操作都在写作面里，这一页不再另放大标题。 */
export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params;
  const post = await getAdminPost(slug);
  if (!post) {
    notFound();
  }

  const save = updatePostAction.bind(null, post.slug);
  const remove = deletePostAction.bind(null, post.slug);

  return (
    <PostEditor
      mode="edit"
      status={adminPostStatus(post)}
      action={save}
      deleteAction={remove}
      initial={{
        slug: post.slug,
        title: post.title,
        date: post.date,
        tags: post.tags.join("，"),
        summary: post.summary,
        cover: post.cover ?? "",
        featured: post.featured,
        body: post.body,
      }}
    />
  );
}
