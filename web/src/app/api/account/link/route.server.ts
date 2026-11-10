/**
 * Account linking API — SERVER MODE only.
 *
 * POST: Initiates linking an email address to the current signed-in account
 * (e.g. an Alipay user linking an email). Sends a transactional confirmation email.
 *
 * GET: Confirms the link token and merges accounts if the target email belongs
 * to an existing released user.
 */
import { confirmLinkEmailToken, requestAccountLink } from "@/server/account/service";
import { getRequestUser } from "@/server/auth/request-user";
import { publicOrigin } from "@/server/email/resend";
import { fail } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return fail("unauthenticated", 401);

  const body = (await req.json().catch(() => ({}))) as { email?: unknown; locale?: unknown };
  const origin = publicOrigin(req);
  const result = await requestAccountLink(user.id, body.email, body.locale, origin);

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true, needsVerification: result.needsVerification });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return Response.json({ ok: false, error: "invalid_token" }, { status: 400 });

  const result = confirmLinkEmailToken(token);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  return Response.json({
    ok: true,
    userId: result.userId,
    mergedWithExisting: result.mergedWithExisting,
  });
}
