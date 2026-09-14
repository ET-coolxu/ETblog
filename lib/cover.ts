/**
 * 封面 URL 校验。无磁盘/鉴权依赖，前台与后台客户端都可引用。
 */

/**
 * 封面只接受站内路径（以 `/` 开头且非 `//`）或 `https://` 外链。
 * 拒绝协议相对地址、http、javascript、data，避免写成可执行或非 HTTPS 资源。
 */
export function asCover(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cover = value.trim();
  if (!cover) {
    return undefined;
  }

  // 协议相对 //example.com 会跟当前页面协议走，不能当站内路径
  if (cover.startsWith("//")) {
    return undefined;
  }

  const lower = cover.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return undefined;
  }
  if (lower.startsWith("http://")) {
    return undefined;
  }

  if (lower.startsWith("https://")) {
    try {
      const parsed = new URL(cover);
      if (parsed.protocol !== "https:") {
        return undefined;
      }
    } catch {
      return undefined;
    }
    return cover;
  }

  if (cover.startsWith("/") && !cover.includes("://")) {
    return cover;
  }

  return undefined;
}
