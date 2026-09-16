"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  previewMarkdownAction,
  type SaveState,
} from "@/app/admin/(dashboard)/posts/actions";
import { asCover } from "@/lib/cover";

export type PostEditorStatus = "draft" | "published" | "archived";

const ARCHIVE_CONFIRM =
  "存档后访客将无法阅读这篇文章（直链返回 404），且不能直接重新发布，须先改为草稿。已上传的图片不会删除。确定存档吗？";
const DELETE_CONFIRM =
  "删除后不可恢复：将删除这篇文章的 Markdown 文件和该文的访问统计，不会删除已上传的图片。确定删除吗？";

/** 新建页没有删除；占位以满足 useActionState 必须无条件调用。 */
const unusedDeleteAction = async (): Promise<SaveState> => ({
  error: "无法删除。",
});

function confirmSubmit(message: string) {
  return (event: MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };
}

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
  /** 编辑已有文章时的当前状态，决定显示哪些操作；新建页不传。 */
  status?: PostEditorStatus;
  action: (state: SaveState, formData: FormData) => Promise<SaveState>;
  deleteAction?: (state: SaveState, formData: FormData) => Promise<SaveState>;
  initial: PostEditorValues;
};

const fieldClass =
  "mt-1 w-full border-b border-rule bg-transparent py-2 text-ink outline-none placeholder:text-muted";

/** 合法封面立刻预览；外链加载失败换成中文说明，避免裂图 */
function CoverPreview({ value }: { value: string }) {
  const cover = asCover(value);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [cover]);

  if (!cover) {
    return null;
  }

  if (failed) {
    return (
      <p className="mt-3 text-sm text-muted" role="status">
        封面图无法加载若是外链，对方站点可能禁止引用
      </p>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cover}
      alt="封面预览"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="mt-3 max-h-40 w-full object-cover"
    />
  );
}

export function PostEditor({
  mode,
  status = "draft",
  action,
  deleteAction = unusedDeleteAction,
  initial,
}: PostEditorProps) {
  const [state, formAction, pending] = useActionState(action, {} satisfies SaveState);
  const [deleteState, deleteFormAction, deleting] = useActionState(
    deleteAction,
    {} satisfies SaveState,
  );
  const busy = pending || deleting;
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
  }, [state.message, router]);

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

  async function uploadOne(file: File): Promise<string | null> {
    const payload = new FormData();
    payload.set("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: payload,
      credentials: "same-origin",
    });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setUploadError(data.error ?? "上传失败");
      return null;
    }
    return data.url;
  }

  async function uploadBodyFiles(files: FileList | File[]) {
    const list = [...files];
    if (list.length === 0) {
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      for (const file of list) {
        const url = await uploadOne(file);
        if (!url) {
          return;
        }
        insertImage(url);
      }
    } catch {
      setUploadError("上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function uploadCoverFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadOne(file);
      if (url) {
        setValues((current) => ({ ...current, cover: url }));
      }
    } catch {
      setUploadError("上传失败");
    } finally {
      setUploading(false);
    }
  }

  function insertImage(url: string) {
    const alt = "图片";
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
    // 选中占位 alt，方便立刻改成具体说明
    const altStart = start + 2;
    const altEnd = altStart + alt.length;
    setValues((current) => ({ ...current, body: next }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(altStart, altEnd);
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) {
      void uploadBodyFiles(event.dataTransfer.files);
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
    void uploadBodyFiles(images);
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
            {mode === "create" ? "仅小写字母、数字和连字符" : "创建时已确定，不可更改"}
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
        <p className="mt-2 text-xs text-muted">留空则发布时用正文前约 120 字</p>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="cover" className="text-sm text-muted">
            封面
          </label>
          <label className="cursor-pointer text-sm text-pine hover:text-ink">
            {uploading ? "上传中…" : "选择图片"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadCoverFile(file);
                }
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <input
          id="cover"
          name="cover"
          value={values.cover}
          onChange={(event) => setValues((current) => ({ ...current, cover: event.target.value }))}
          placeholder="/uploads/2026/09/cover.webp 或 https://"
          className={fieldClass}
        />
        <CoverPreview value={values.cover} />
        <p className="mt-2 text-xs text-muted">
          可上传或填写站内路径、https 外链
        </p>
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
                  void uploadBodyFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          可拖拽或粘贴图片插入后说明默认为「图片」，可改成具体描述
        </p>
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
              <p className="text-sm text-muted">预览显示</p>
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
      {state.error || deleteState.error ? (
        <p className="text-sm text-pine" role="alert">
          {state.error ?? deleteState.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-muted" role="status">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-6">
        {mode === "create" || status === "draft" ? (
          <>
            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={busy}
              className="text-muted hover:text-ink disabled:text-muted"
            >
              {pending ? "保存中…" : "保存草稿"}
            </button>
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={busy}
              className="text-pine hover:text-ink disabled:text-muted"
            >
              {pending ? "保存中…" : "发布"}
            </button>
          </>
        ) : null}
        {mode === "edit" && status === "published" ? (
          <>
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={busy}
              className="text-pine hover:text-ink disabled:text-muted"
            >
              {pending ? "保存中…" : "保存"}
            </button>
            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={busy}
              className="text-muted hover:text-ink disabled:text-muted"
            >
              {pending ? "保存中…" : "改为草稿"}
            </button>
            <button
              type="submit"
              name="intent"
              value="archive"
              disabled={busy}
              onClick={confirmSubmit(ARCHIVE_CONFIRM)}
              className="text-muted hover:text-ink disabled:text-muted"
            >
              {pending ? "保存中…" : "存档"}
            </button>
          </>
        ) : null}
        {mode === "edit" && status === "archived" ? (
          <>
            <button
              type="submit"
              name="intent"
              value="archive"
              disabled={busy}
              className="text-pine hover:text-ink disabled:text-muted"
            >
              {pending ? "保存中…" : "保存"}
            </button>
            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={busy}
              className="text-muted hover:text-ink disabled:text-muted"
            >
              {pending ? "保存中…" : "改为草稿"}
            </button>
          </>
        ) : null}
        {mode === "edit" ? (
          <button
            type="submit"
            formAction={deleteFormAction}
            disabled={busy}
            onClick={confirmSubmit(DELETE_CONFIRM)}
            className="text-muted hover:text-ink disabled:text-muted"
          >
            {deleting ? "删除中…" : "删除"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
