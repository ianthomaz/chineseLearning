/**
 * Signed auth info string for the iOS AlipaySDK (`auth_V2WithInfo`).
 * GET /api/app/alipay/auth-info?targetId=…  →  { ok, infoStr, scheme }
 *
 * Private key stays on the server. Requires ALIPAY_MOBILE_* (+ pid 2088…).
 */
import { buildMobileAuthInfoStr, alipayMobileConfig, ALIPAY_IOS_CALLBACK_SCHEME } from "@/server/auth/alipay";
import { fail, limited } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const tooMany = limited(req, "alipay-auth-info", 30, 60_000);
  if (tooMany) return tooMany;

  const config = alipayMobileConfig();
  if (!config) {
    return fail("alipay_mobile_unconfigured", 503);
  }

  const url = new URL(req.url);
  const targetId = (url.searchParams.get("targetId") || "").trim().slice(0, 32);
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(targetId)) {
    return fail("invalid_target", 400);
  }

  return Response.json({
    ok: true,
    infoStr: buildMobileAuthInfoStr(config, targetId),
    scheme: ALIPAY_IOS_CALLBACK_SCHEME,
  });
}
