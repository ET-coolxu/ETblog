/**
 * Publish API 的 Bearer 校验。与后台 session 分开：只认环境变量里的 token。
 */
import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * 从 Authorization 取出 Bearer token。
 * 方案名不区分大小写；缺失或不是 Bearer 时返回 null。
 */
function readBearerToken(authorization: string | null): string | null {
  if (!authorization) {
    return null;
  }

  const match = /^Bearer\s+(\S+)\s*$/i.exec(authorization);
  if (!match) {
    return null;
  }

  return match[1];
}

/**
 * 判断请求是否带有正确的 Publish API token。
 * 未配置、缺失或错误都返回 false，调用方统一回 401，避免泄露 token 是否存在。
 * 比较前先做 SHA-256，使两边摘要等长，避免按原文长度提前返回。
 */
export function isPublishAuthorized(authorization: string | null): boolean {
  const expected = process.env.PUBLISH_API_TOKEN ?? "";
  if (!expected) {
    return false;
  }

  const token = readBearerToken(authorization);
  if (!token) {
    return false;
  }

  const left = createHash("sha256").update(expected, "utf8").digest();
  const right = createHash("sha256").update(token, "utf8").digest();
  return timingSafeEqual(left, right);
}
