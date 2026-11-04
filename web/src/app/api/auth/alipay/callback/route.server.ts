/**
 * Alipay return — SERVER MODE (`route.server.ts`; absent under static export).
 *
 * Checks the state cookie, exchanges the one-time `auth_code`, and writes
 * the same Auth.js session cookie as Google. Failure goes back to the page
 * that started login, with `authError=alipay` and no Alipay detail in the URL.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  ALIPAY_STATE_COOKIE,
  alipayConfig,
  exchangeAuthCode,
  unpackStateCookie,
  withAuthError,
} from "@/server/auth/alipay";
import { resolveOAuthUser } from "@/server/db/identity";
import {
  AUTH_SESSION_MAX_AGE,
  authSessionCookieName,
  authSessionToken,
  authUsesSecureCookie,
} from "@/server/auth/session-cookie";
import { clientIp } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

function clearState(
  res: NextResponse,
  secure: boolean,
): NextResponse {
  res.cookies.set(ALIPAY_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function GET(req: NextRequest) {
  const config = alipayConfig();
  if (!config) return new Response("Not found", { status: 404 });

  const secure = authUsesSecureCookie();
  const origin = new URL(config.redirectUri).origin;
  const stored = unpackStateCookie(req.cookies.get(ALIPAY_STATE_COOKIE)?.value ?? "");
  const returnPath = stored?.returnPath ?? "/";

  const fail = (reason: string) => {
    console.warn("[alipay] callback rejected", reason);
    return clearState(NextResponse.redirect(new URL(withAuthError(returnPath), origin)), secure);
  };

  const state = req.nextUrl.searchParams.get("state") ?? "";
  const authCode = req.nextUrl.searchParams.get("auth_code") ?? "";
  if (!stored || stored.state !== state) return fail("state");
  if (!authCode) return fail("missing_code");
  if (!rateLimit(`alipay-callback:${clientIp(req)}`, 30, 60_000)) return fail("rate");

  const exchanged = await exchangeAuthCode(authCode, config);
  if (!exchanged.ok) return fail(`${exchanged.reason}${exchanged.detail ? ` ${exchanged.detail}` : ""}`);

  let userId: string;
  try {
    userId = resolveOAuthUser({
      provider: "alipay",
      providerAccountId: exchanged.openId,
    });
  } catch (err) {
    console.warn("[alipay] could not resolve user", err instanceof Error ? err.name : "error");
    return fail("identity");
  }

  let token: string;
  try {
    token = await authSessionToken(userId, secure);
  } catch (err) {
    console.warn("[alipay] could not write session", err instanceof Error ? err.name : "error");
    return fail("session");
  }

  const dest = new URL(returnPath, origin);
  dest.searchParams.delete("authError");
  const res = NextResponse.redirect(dest);
  res.cookies.set(authSessionCookieName(secure), token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE,
  });
  return clearState(res, secure);
}
