/**
 * The signed-in account — site (cookie) or app (Bearer).
 * GET: profile + NOIA clearance + linked providers. DELETE: delete the account
 * and its progress (App Store guideline 5.1.1(v)).
 */
import { accountPayload } from "@/server/account/service";
import { getRequestUser } from "@/server/auth/request-user";
import { deleteAccount } from "@/server/db/identity";
import { fail } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return fail("unauthenticated", 401);
  const account = accountPayload(user.id);
  return account ? Response.json({ ok: true, account }) : fail("unauthenticated", 401);
}

export async function DELETE(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return fail("unauthenticated", 401);
  deleteAccount(user.id);
  return Response.json({ ok: true });
}
