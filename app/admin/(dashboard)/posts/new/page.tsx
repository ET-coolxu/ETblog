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

export default function NewPostPage() {
  return (
    <main className="page-wide">
      <h1 className="doc-title">写文章</h1>
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
    </main>
  );
}
