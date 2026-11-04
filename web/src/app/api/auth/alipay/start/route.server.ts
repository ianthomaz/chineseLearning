/**
 * Start Alipay login — SERVER MODE (`route.server.ts`; absent under static export).
 *
 * Sets a short httpOnly state cookie and sends the browser to Alipay.
 * The return path is the page that sent the person here (same site only).
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  ALIPAY_IOS_RETURN_PATH,
  ALIPAY_STATE_COOKIE,
  ALIPAY_STATE_MAX_AGE,
  alipayAuthorizeUrl,
  alipayConfig,
  isSafeReturnPath,
  newOAuthState,
  packStateCookie,
} from "@/server/auth/alipay";
import { authUsesSecureCookie } from "@/server/auth/session-cookie";
import { limited } from "@/server/http";

export const dynamic = "force-dynamic";

function returnPathFrom(req: NextRequest, origin: string): string {
  if (req.nextUrl.searchParams.get("client") === "ios") return ALIPAY_IOS_RETURN_PATH;
  const referer = req.headers.get("referer");
  if (!referer) return "/";
  try {
    const url = new URL(referer);
    if (url.origin !== origin) return "/";
    url.searchParams.delete("authError");
    const path = `${url.pathname}${url.search}`;
    return isSafeReturnPath(path) ? path : "/";
  } catch {
    return "/";
  }
}

export function GET(req: NextRequest) {
  const blocked = limited(req, "alipay-start", 20, 60_000);
  if (blocked) return blocked;

  const config = alipayConfig();
  if (!config) return new Response("Not found", { status: 404 });

  const state = newOAuthState();
  const secure = authUsesSecureCookie();
  const res = NextResponse.redirect(alipayAuthorizeUrl(config, state));
  res.cookies.set(ALIPAY_STATE_COOKIE, packStateCookie(state, returnPathFrom(req, new URL(config.redirectUri).origin)), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ALIPAY_STATE_MAX_AGE,
  });
  return res;
}
