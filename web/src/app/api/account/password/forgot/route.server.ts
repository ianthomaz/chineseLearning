/** "Forgot password": emails a reset link if the address has an account. Always 200. */
import { requestPasswordReset } from "@/server/account/service";
import { publicOrigin } from "@/server/email/resend";
import { limited, readJson } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooMany = limited(req, "password-forgot", 3, 15 * 60_000);
  if (tooMany) return tooMany;
  const body = await readJson(req);
  await requestPasswordReset(body.email, body.locale, publicOrigin(req));
  return Response.json({ ok: true });
}
