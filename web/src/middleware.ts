import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function publicBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
}

/**
 * Route Handlers are registered at /api/* while public URLs use basePath (/aulaChines/...).
 * Rewrite so fetch("/aulaChines/api/chat") reaches the Route Handler.
 */
export function middleware(request: NextRequest) {
  const base = publicBasePath();
  if (!base) return NextResponse.next();

  const path = request.nextUrl.pathname;
  if (!path.startsWith(`${base}/api/`)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = path.slice(base.length);
  return NextResponse.rewrite(url);
}

/**
 * Broad matcher: Next does not match `/aulaChines/api/*` when basePath is set (pathname in matcher
 * is not what we expect). We filter in code and only rewrite `{basePath}/api/*`.
 * @see https://github.com/vercel/next.js/issues/62756
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
