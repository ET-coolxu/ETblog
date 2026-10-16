import type { Metadata } from "next";
import { createPostAction } from "@/app/admin/(dashboard)/posts/actions";
import { PostEditor } from "@/components/post-editor";

export const metadata: Metadata = {
  title: "写文章",
};

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 新建文章。顶栏和文稿栏都在写作面里，本页不再另放大标题。 */
export default function NewPostPage() {
  return (
    <PostEditor
      mode="create"
      action={createPostAction}
      initial={{
        slug: "",
        title: "",
        date: todayIso(),
        tags: "",
        summary: "",
        cover: "",
        featured: false,
        body: "",
      }}
    />
  );
}
