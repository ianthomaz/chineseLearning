/** New confirmation link for a pending account. Always 200 (no account probing). */
import { resendVerification } from "@/server/account/service";
import { publicOrigin } from "@/server/email/resend";
import { limited, readJson } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooMany = limited(req, "resend-verification", 3, 15 * 60_000);
  if (tooMany) return tooMany;
  const body = await readJson(req);
  await resendVerification(body.email, body.locale, publicOrigin(req));
  return Response.json({ ok: true });
}
