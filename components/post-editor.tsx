"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import {
  previewMarkdownAction,
  type SaveState,
} from "@/app/admin/(dashboard)/posts/actions";

export type PostEditorValues = {
  slug: string;
  title: string;
  date: string;
  tags: string;
  summary: string;
  cover: string;
  featured: boolean;
  body: string;
};

type PostEditorProps = {
  mode: "create" | "edit";
  action: (state: SaveState, formData: FormData) => Promise<SaveState>;
  initial: PostEditorValues;
};

const fieldClass =
  "mt-1 w-full border-b border-rule bg-transparent py-2 text-ink outline-none placeholder:text-muted";

export function PostEditor({ mode, action, initial }: PostEditorProps) {
  const [state, formAction, pending] = useActionState(action, {} satisfies SaveState);
  const [values, setValues] = useState(initial);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const source = values.body;
    if (!source.trim()) {
      setPreviewHtml("");
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      const html = await previewMarkdownAction(source);
      if (!cancelled) {
        setPreviewHtml(html);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [values.body]);

  async function uploadFiles(files: FileList | File[]) {
    const list = [...files];
    if (list.length === 0) {
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      for (const file of list) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body,
          credentials: "same-origin",
        });
        const data = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !data.url) {
          setUploadError(data.error ?? "上传失败。");
          return;
        }
        insertImage(data.url, file.name.replace(/\.[^.]+$/, "") || "图片");
      }
    } catch {
      setUploadError("上传失败。");
    } finally {
      setUploading(false);
    }
  }

  function insertImage(url: string, alt: string) {
    const snippet = `![${alt}](${url})`;
    const textarea = bodyRef.current;
    if (!textarea) {
      setValues((current) => ({
        ...current,
        body: current.body ? `${current.body}\n\n${snippet}` : snippet,
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
    const caret = start + snippet.length;
    setValues((current) => ({ ...current, body: next }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) {
      void uploadFiles(event.dataTransfer.files);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const clipboard = event.clipboardData;
    if (!clipboard?.files.length) {
      return;
    }
    const images = [...clipboard.files].filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      return;
    }
    event.preventDefault();
    void uploadFiles(images);
  }

  return (
    <form action={formAction} className="mt-10 space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="slug" className="block text-sm text-muted">
            slug
          </label>
          <input
            id="slug"
            name="slug"
            value={values.slug}
            onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))}
            readOnly={mode === "edit"}
            required
            pattern="[a-z0-9-]+"
            title="仅小写字母、数字和连字符"
            className={`${fieldClass} ${mode === "edit" ? "text-muted" : ""}`}
          />
          <p className="mt-2 text-xs text-muted">
            {mode === "create" ? "创建后不可更改。" : "创建时已确定，不可更改。"}
          </p>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm text-muted">
            日期
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={values.date}
            onChange={(event) => setValues((current) => ({ ...current, date: event.target.value }))}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm text-muted">
          标题
        </label>
        <input
          id="title"
          name="title"
          required
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm text-muted">
          标签
        </label>
        <input
          id="tags"
          name="tags"
          value={values.tags}
          onChange={(event) => setValues((current) => ({ ...current, tags: event.target.value }))}
          placeholder="用逗号分隔，例如：笔记，Markdown"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm text-muted">
          摘要
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          value={values.summary}
          onChange={(event) => setValues((current) => ({ ...current, summary: event.target.value }))}
          className="mt-1 w-full border-b border-rule bg-transparent py-2 text-ink outline-none placeholder:text-muted"
        />
        <p className="mt-2 text-xs text-muted">留空则发布时用正文前约 120 字。</p>
      </div>

      <div>
        <label htmlFor="cover" className="block text-sm text-muted">
          封面路径
        </label>
        <input
          id="cover"
          name="cover"
          value={values.cover}
          onChange={(event) => setValues((current) => ({ ...current, cover: event.target.value }))}
          placeholder="/uploads/2026/09/cover.webp"
          className={fieldClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="featured"
          checked={values.featured}
          onChange={(event) =>
            setValues((current) => ({ ...current, featured: event.target.checked }))
          }
        />
        设为首页精选
      </label>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="relative"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="body" className="text-sm text-muted">
            正文（Markdown）
          </label>
          <label className="cursor-pointer text-sm text-pine hover:text-ink">
            {uploading ? "上传中…" : "选择图片"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                if (event.target.files) {
                  void uploadFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">可拖拽或粘贴图片，插入 `![说明](/uploads/...)`。</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <textarea
            ref={bodyRef}
            id="body"
            name="body"
            value={values.body}
            onChange={(event) => setValues((current) => ({ ...current, body: event.target.value }))}
            onPaste={onPaste}
            className="min-h-112 w-full resize-y border border-rule bg-transparent p-3 font-mono text-sm leading-7 text-ink outline-none"
          />
          <div className="min-h-112 overflow-auto border border-rule p-3">
            {previewHtml ? (
              <div className="markdown" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <p className="text-sm text-muted">预览将显示在这里。</p>
            )}
          </div>
        </div>
        {dragging ? (
          <div className="absolute inset-0 flex items-center justify-center border border-dashed border-pine bg-paper/80 text-sm text-pine">
            松开以上传图片
          </div>
        ) : null}
      </div>

      {uploadError ? (
        <p className="text-sm text-pine" role="alert">
          {uploadError}
        </p>
      ) : null}
      {state.error ? (
        <p className="text-sm text-pine" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-muted" role="status">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-6">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="text-muted hover:text-ink disabled:text-muted"
        >
          {pending ? "保存中…" : "保存草稿"}
        </button>
        <button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          className="text-pine hover:text-ink disabled:text-muted"
        >
          {pending ? "保存中…" : "发布"}
        </button>
      </div>
    </form>
  );
}
