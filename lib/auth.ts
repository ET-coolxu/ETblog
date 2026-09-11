import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-constants";

export { ADMIN_SESSION_COOKIE };

const SESSION_DAYS = 7;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

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

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: (process.env.SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge,
  };
}

export function createAdminSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: "admin",
      exp: Date.now() + SESSION_MAX_AGE * 1000,
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

export async function requireAdminSession(): Promise<void> {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const secret = getSecret();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!secret || !expectedPassword) {
    return false;
  }

  const expectedUser = process.env.ADMIN_USER?.trim() || "admin";
  const userOk = safeEqual(sign(`user:${username}`), sign(`user:${expectedUser}`));
  const passOk = safeEqual(sign(`pass:${password}`), sign(`pass:${expectedPassword}`));
  return userOk && passOk;
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), sessionCookieOptions(SESSION_MAX_AGE));
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, "", sessionCookieOptions(0));
}
