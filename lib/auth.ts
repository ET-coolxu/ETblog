import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;

type SessionPayload = {
  role: "admin";
  exp: number;
};

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function createAdminSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: "admin",
      exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    } satisfies SessionPayload),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  if (!getSecret() || !token) {
    return false;
  }

  const separator = token.lastIndexOf(".");
  if (separator <= 0) {
    return false;
  }

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, sign(payload))) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    return data.role === "admin" && typeof data.exp === "number" && Date.now() < data.exp;
  } catch {
    return false;
  }
}

export async function hasAdminSession(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }

  return verifyAdminSessionToken(token);
}
