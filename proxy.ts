import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "app_session";
const AUTH_PATHS = ["/login", "/register"];
const API_AUTH_PREFIX = "/api/auth";

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isApiAuth(pathname: string): boolean {
  return pathname.startsWith(API_AUTH_PREFIX);
}

function isStaticOrNext(pathname: string): boolean {
  return pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".");
}

/**
 * 保护需登录的路由：非登录/注册/静态资源且无 session Cookie 时重定向到 /login。
 * 已登录用户访问 /login、/register 时重定向到 /。
 * Session 合法性由 getSession() 在服务端校验（Redis/DB），此处仅做 Cookie 存在性检查。
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasCookie = request.cookies.has(COOKIE_NAME);

  // 已登录用户不允许访问登录/注册页，重定向到首页
  if (isAuthPath(pathname) && hasCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthPath(pathname) || isApiAuth(pathname) || isStaticOrNext(pathname)) {
    return NextResponse.next();
  }

  if (!hasCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
