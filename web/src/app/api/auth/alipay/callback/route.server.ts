/**
 * Alipay return — SERVER MODE (`route.server.ts`; absent under static export).
 *
 * Checks the state cookie, exchanges the one-time `auth_code`, optionally
 * reads `alipay.user.info.share`, and writes the Auth.js session cookie.
 * Alipay email is unverified and never authorizes an account merge. Failure goes back with
 * `authError=alipay` and no Alipay detail in the URL.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  ALIPAY_IOS_CALLBACK_SCHEME,
  ALIPAY_IOS_RETURN_PATH,
  ALIPAY_STATE_COOKIE,
  alipayConfig,
  completeAlipayLogin,
  unpackStateCookie,
  withAuthError,
} from "@/server/auth/alipay";
import {
  createAppAuthExchange,
  getIdentityUser,
  resolveOAuthUser,
} from "@/server/db/identity";
import {
  AUTH_SESSION_MAX_AGE,
  authSessionCookieName,
  authSessionToken,
  authUsesSecureCookie,
} from "@/server/auth/session-cookie";
import { clientIp } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

function clearState(res: NextResponse, secure: boolean): NextResponse {
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
  const forIos = returnPath === ALIPAY_IOS_RETURN_PATH;

  const fail = (reason: string) => {
    console.warn("[alipay] callback rejected", reason);
    if (forIos) {
      const failUrl = new URL(`${ALIPAY_IOS_CALLBACK_SCHEME}://alipay`);
      failUrl.searchParams.set("error", "alipay");
      return clearState(NextResponse.redirect(failUrl), secure);
    }
    return clearState(NextResponse.redirect(new URL(withAuthError(returnPath), origin)), secure);
  };

  const state = req.nextUrl.searchParams.get("state") ?? "";
  const authCode = req.nextUrl.searchParams.get("auth_code") ?? "";
  if (!stored || stored.state !== state) return fail("state");
  if (!authCode) return fail("missing_code");
  if (!rateLimit(`alipay-callback:${clientIp(req)}`, 30, 60_000)) return fail("rate");

  const completed = await completeAlipayLogin(authCode, config);
  if (!completed.ok) {
    return fail(`${completed.reason}${"detail" in completed && completed.detail ? ` ${completed.detail}` : ""}`);
  }

  let userId: string;
  try {
    const { profile } = completed;
    userId = resolveOAuthUser({
      provider: "alipay",
      providerAccountId: profile.openId,
      email: profile.email,
      emailVerified: false,
      name: profile.name,
      image: profile.image,
    });
  } catch (err) {
    console.warn("[alipay] could not resolve user", err instanceof Error ? err.name : "error");
    return fail("identity");
  }

  // iOS app: hand a one-time exchange code back to ASWebAuthenticationSession.
  if (forIos) {
    try {
      const exchange = createAppAuthExchange(userId);
      const appUrl = new URL(`${ALIPAY_IOS_CALLBACK_SCHEME}://alipay`);
      appUrl.searchParams.set("exchange", exchange);
      return clearState(NextResponse.redirect(appUrl), secure);
    } catch (err) {
      console.warn("[alipay] could not mint app exchange", err instanceof Error ? err.name : "error");
      return fail("exchange");
    }
  }

  let token: string;
  try {
    const user = getIdentityUser(userId);
    token = await authSessionToken(userId, secure, {
      name: user?.nick ?? user?.name ?? null,
      // Site admin/curator gates use session email; never grant them from an unverified claim.
      email: user?.emailVerifiedAt ? user.email : null,
      image: user?.image ?? null,
    });
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
