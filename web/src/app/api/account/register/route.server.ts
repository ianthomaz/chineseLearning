/**
 * Email + password sign-up — site and iOS app. SERVER MODE only.
 * Body: { email, emailConfirm, password, locale }. Creates a pending (O1)
 * account and emails a confirmation link; the account is released (O4) when
 * the link is opened (`/account/verify`).
 */
import { registerAccount } from "@/server/account/service";
import { publicOrigin } from "@/server/email/resend";
import { fail, limited, readJson } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooMany = limited(req, "register", 5, 15 * 60_000);
  if (tooMany) return tooMany;

  const body = await readJson(req);
  const result = await registerAccount(body, publicOrigin(req));
  if (!result.ok) return fail(result.error, result.error === "email_taken" ? 409 : result.error === "email_failed" ? 502 : 400);
  return Response.json({
    ok: true,
    needsVerification: result.needsVerification,
    status: result.needsVerification ? "verification_sent" : "linked_ready",
  });
}
