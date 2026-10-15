import styles from "./preview-badge.module.css";

/**
 * 预览角标文案。只在 Vercel Preview（`VERCEL_ENV === "preview"`）且有分支名时返回文案。
 * VPS 和生产环境不会设置这个值；未设置时不能当成预览，也不看 NODE_ENV。
 */
export function previewBadgeLabel(env: {
  ref?: string;
  sha?: string;
  vercelEnv?: string;
}): string | null {
  if (env.vercelEnv !== "preview" || !env.ref) {
    return null;
  }

  const short = env.sha?.slice(0, 7);
  return short ? `${env.ref} · ${short}` : env.ref;
}

/**
 * 固定在页面底角的预览标记。只在 Vercel Preview 读取分支和短提交。
 */
export function PreviewBadge() {
  const label = previewBadgeLabel({
    ref: process.env.VERCEL_GIT_COMMIT_REF,
    sha: process.env.VERCEL_GIT_COMMIT_SHA,
    vercelEnv: process.env.VERCEL_ENV,
  });

  if (!label) {
    return null;
  }

  return <p className={styles.badge}>{label}</p>;
}
