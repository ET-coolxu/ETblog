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
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  previewMarkdownAction,
  type SaveState,
} from "@/app/admin/(dashboard)/posts/actions";
import { asCover } from "@/lib/cover";
import styles from "./post-editor.module.css";

export type PostEditorStatus = "draft" | "published" | "archived";

const ARCHIVE_CONFIRM =
  "存档后访客将无法阅读这篇文章（直链返回 404），且不能直接重新发布，须先改为草稿。已上传的图片不会删除。确定存档吗？";
const DELETE_CONFIRM =
  "删除后不可恢复：将删除这篇文章的 Markdown 文件和该文的访问统计，不会删除已上传的图片。确定删除吗？";

const STATUS_LABEL: Record<PostEditorStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "存档",
};

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
  /** 编辑已有文章时的已保存状态，决定按钮和状态 pill；不随未提交操作变化。 */
  status?: PostEditorStatus;
  action: (state: SaveState, formData: FormData) => Promise<SaveState>;
  deleteAction?: (state: SaveState, formData: FormData) => Promise<SaveState>;
  initial: PostEditorValues;
};

/** 收起文稿栏时仍把字段交出去。hidden 不参与浏览器必填校验，避免藏起来的控件拦住提交。 */
function HiddenMeta({ values }: { values: PostEditorValues }) {
  return (
    <>
      <input type="hidden" name="slug" value={values.slug} />
      <input type="hidden" name="date" value={values.date} />
      <input type="hidden" name="title" value={values.title} />
      <input type="hidden" name="tags" value={values.tags} />
      <input type="hidden" name="summary" value={values.summary} />
      <input type="hidden" name="cover" value={values.cover} />
      {values.featured ? <input type="hidden" name="featured" value="on" /> : null}
    </>
  );
}

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
      <p className={`${styles.note} mt-3`} role="status">
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
      className={styles.cover}
    />
  );
}

/**
 * 后台写作面：顶栏操作、可收起的文稿栏、Markdown 与预览。
 * 按钮按已保存状态显示；收起只藏文稿栏，刷新后默认展开。
 */
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
  const [metaOpen, setMetaOpen] = useState(true);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const saveLabel = pending ? "保存中…" : "";

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

  const showDraftActions = mode === "create" || status === "draft";
  const showPublishedActions = mode === "edit" && status === "published";
  const showArchivedActions = mode === "edit" && status === "archived";
  const showDelete = mode === "edit" && status !== "draft";

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.bar}>
        <div className={styles.barLead}>
          <Link href="/admin" className={styles.back}>
            ← 文章
          </Link>
          <span className={styles.sep} aria-hidden>
            |
          </span>
          <span className={styles.barTitle}>{values.title.trim() || "未命名"}</span>
          {mode === "edit" ? (
            <span className={`${styles.pill} ${styles[status]}`}>{STATUS_LABEL[status]}</span>
          ) : null}
        </div>
        <div className={styles.barActions}>
          {showDraftActions ? (
            <>
              <button
                type="submit"
                name="intent"
                value="draft"
                disabled={busy}
                className={styles.secondary}
              >
                {saveLabel || "保存草稿"}
              </button>
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={busy}
                className={styles.primary}
              >
                {saveLabel || "发布"}
              </button>
            </>
          ) : null}
          {showPublishedActions ? (
            <>
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={busy}
                className={styles.primary}
              >
                {saveLabel || "保存"}
              </button>
              <button
                type="submit"
                name="intent"
                value="draft"
                disabled={busy}
                className={styles.secondary}
              >
                {saveLabel || "改为草稿"}
              </button>
              <button
                type="submit"
                name="intent"
                value="archive"
                disabled={busy}
                onClick={confirmSubmit(ARCHIVE_CONFIRM)}
                className={styles.weak}
              >
                {saveLabel || "存档"}
              </button>
            </>
          ) : null}
          {showArchivedActions ? (
            <>
              <button
                type="submit"
                name="intent"
                value="archive"
                disabled={busy}
                className={styles.primary}
              >
                {saveLabel || "保存"}
              </button>
              <button
                type="submit"
                name="intent"
                value="draft"
                disabled={busy}
                className={styles.secondary}
              >
                {saveLabel || "改为草稿"}
              </button>
            </>
          ) : null}
          {showDelete && showPublishedActions ? <span className={styles.divider} aria-hidden /> : null}
          {showDelete ? (
            <button
              type="submit"
              formAction={deleteFormAction}
              disabled={busy}
              onClick={confirmSubmit(DELETE_CONFIRM)}
              className={styles.danger}
            >
              {deleting ? "删除中…" : "删除"}
            </button>
          ) : null}
        </div>
      </div>

      {uploadError || state.error || deleteState.error || state.message ? (
        <div className={styles.feedback}>
          {uploadError ? (
            <p className={styles.alert} role="alert">
              {uploadError}
            </p>
          ) : null}
          {state.error || deleteState.error ? (
            <p className={styles.alert} role="alert">
              {state.error ?? deleteState.error}
            </p>
          ) : null}
          {state.message ? (
            <p className={styles.note} role="status">
              {state.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={styles.surface}>
        <aside className={metaOpen ? styles.meta : styles.metaShut}>
          <div className={styles.metaHead}>
            {metaOpen ? <span>文稿信息</span> : null}
            <button
              type="button"
              className={styles.textButton}
              aria-expanded={metaOpen}
              onClick={() => setMetaOpen((open) => !open)}
            >
              {metaOpen ? "收起" : "展开"}
            </button>
          </div>
          {metaOpen ? (
            <div className={styles.metaBody}>
              <div>
                <label htmlFor="slug" className={styles.label}>
                  slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  value={values.slug}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, slug: event.target.value }))
                  }
                  readOnly={mode === "edit"}
                  required
                  pattern="[a-z0-9-]+"
                  title="仅小写字母、数字和连字符"
                  className={mode === "edit" ? `${styles.field} ${styles.dim}` : styles.field}
                />
                <p className={styles.hint}>
                  {mode === "create" ? "仅小写字母、数字和连字符" : "创建后不可改"}
                </p>
              </div>
              <div>
                <label htmlFor="date" className={styles.label}>
                  日期
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  value={values.date}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, date: event.target.value }))
                  }
                  className={styles.field}
                />
              </div>
              <div>
                <label htmlFor="title" className={styles.label}>
                  标题
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  value={values.title}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, title: event.target.value }))
                  }
                  className={styles.field}
                />
              </div>
              <div>
                <label htmlFor="tags" className={styles.label}>
                  标签
                </label>
                <input
                  id="tags"
                  name="tags"
                  value={values.tags}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, tags: event.target.value }))
                  }
                  placeholder="用逗号分隔，例如：笔记，Markdown"
                  className={styles.field}
                />
              </div>
              <div>
                <label htmlFor="summary" className={styles.label}>
                  摘要
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={3}
                  value={values.summary}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, summary: event.target.value }))
                  }
                  className={styles.field}
                />
                <p className={styles.hint}>留空则发布时用正文前约 120 字</p>
              </div>
              <div>
                <label htmlFor="cover" className={styles.label}>
                  封面
                </label>
                <div className={styles.coverRow}>
                  <input
                    id="cover"
                    name="cover"
                    value={values.cover}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, cover: event.target.value }))
                    }
                    placeholder="/uploads/… 或 https://"
                    className={styles.field}
                  />
                  <label className={styles.pick}>
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
                <CoverPreview value={values.cover} />
                <p className={styles.hint}>可上传或填写站内路径、https 外链</p>
              </div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="featured"
                  checked={values.featured}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, featured: event.target.checked }))
                  }
                />
                精选
              </label>
            </div>
          ) : (
            <HiddenMeta values={values} />
          )}
        </aside>

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
          className={styles.write}
        >
          <div className={styles.split}>
            <div className={styles.pane}>
              <div className={styles.paneHead}>
                <span>Markdown</span>
                <label className={styles.pick}>
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
              <textarea
                ref={bodyRef}
                id="body"
                name="body"
                value={values.body}
                onChange={(event) =>
                  setValues((current) => ({ ...current, body: event.target.value }))
                }
                onPaste={onPaste}
                spellCheck={false}
                className={styles.area}
                aria-label="正文（Markdown）"
                title="可拖拽或粘贴图片。插入后说明默认为「图片」，可改成具体描述"
              />
            </div>
            <div className={styles.pane}>
              <div className={styles.paneHead}>
                <span>预览</span>
              </div>
              <div className={styles.preview}>
                {previewHtml ? (
                  <div className="markdown" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <p className={styles.note}>预览将显示在这里</p>
                )}
              </div>
            </div>
          </div>
          {dragging ? <div className={styles.drop}>松开以上传图片</div> : null}
        </div>
      </div>
    </form>
  );
}
