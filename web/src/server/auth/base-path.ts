import { NextRequest } from "next/server";
import { getPublicBasePath } from "@/lib/publicBasePath";

/** Public Auth.js mount (browser + OAuth callbacks), e.g. `/api/auth`. */
export function getAuthBasePath(): string {
  const site = getPublicBasePath();
  return site ? `${site}/api/auth` : "/api/auth";
}

/**
 * When basePath is set, `start-server-stripped.mjs` may strip the prefix before Next.
 * Auth.js must still see the public pathname (e.g. `/api/auth/session`).
 */
export function prepareAuthRequest(req: NextRequest): NextRequest {
  const site = getPublicBasePath();
  if (!site) return req;

  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/auth")) return req;
  if (pathname.startsWith(`${site}/`)) return req;

  const url = req.nextUrl.clone();
  url.pathname = `${site}${pathname}`;
  return new NextRequest(url, req);
}
