/** iOS app sign-out: revokes the Bearer token it sends. */
import { bearerToken } from "@/server/auth/request-user";
import { revokeAppSession } from "@/server/db/identity";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  const token = bearerToken(req);
  if (token) revokeAppSession(token);
  return Response.json({ ok: true });
}
