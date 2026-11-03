/** Sets a new password from a reset link. Body: { token, password }. */
import { resetPassword } from "@/server/account/service";
import { fail, limited, readJson } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const tooMany = limited(req, "password-reset", 10, 15 * 60_000);
  if (tooMany) return tooMany;
  const body = await readJson(req);
  const result = await resetPassword(body.token, body.password);
  return result.ok ? Response.json({ ok: true }) : fail(result.error);
}
