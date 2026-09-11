import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has(ADMIN_SESSION_COOKIE);

  if (pathname === "/api/upload") {
    if (!hasCookie) {
      return NextResponse.json({ error: "请先登录。" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdmin) {
    return NextResponse.next();
  }

  const isPublicAdmin =
    pathname === "/admin/login" || pathname === "/admin/logout";
  if (!isPublicAdmin && !hasCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/upload"],
};
