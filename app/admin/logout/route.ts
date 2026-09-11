import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-constants";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: 0,
  });
  return response;
}
