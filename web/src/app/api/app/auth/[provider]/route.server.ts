/**
 * iOS app sign-in → app session token (Bearer). SERVER MODE only.
 *
 *   POST /api/app/auth/password  { email, password }
 *   POST /api/app/auth/apple     { identityToken, nonce?, givenName?, familyName? }
 *   POST /api/app/auth/google    { idToken }
 *
 * Response: { ok, token, account }. The token goes in `Authorization: Bearer …`
 * for `/api/account`, `/api/game/round` and `/api/game/progress`.
 */
import { accountPayload, passwordSignIn } from "@/server/account/service";
import { verifyAppleIdToken } from "@/server/auth/verify-apple-id-token";
import { verifyGoogleIdToken } from "@/server/auth/verify-google-id-token";
import { createAppSession, resolveOAuthUser } from "@/server/db/identity";
import { fail, limited, readJson } from "@/server/http";

export const dynamic = "force-dynamic";

function text(v: unknown, max = 200): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

async function signIn(provider: string, body: Record<string, unknown>): Promise<string | Response> {
  switch (provider) {
    case "password": {
      const result = await passwordSignIn(body.email, body.password);
      return result.ok ? result.userId : fail(result.error, 401);
    }
    case "apple": {
      const token = text(body.identityToken, 4000);
      if (!token) return fail("invalid_token");
      const payload = await verifyAppleIdToken(token, text(body.nonce));
      if (!payload) return fail("invalid_token", 401);
      // Apple sends the name only on the very first authorization, to the app.
      const name = [text(body.givenName, 80), text(body.familyName, 80)].filter(Boolean).join(" ") || null;
      return resolveOAuthUser({
        provider: "apple",
        providerAccountId: payload.sub,
        email: payload.email ?? null,
        emailVerified: payload.emailVerified && !payload.isPrivateEmail,
        name,
      });
    }
    case "google": {
      const token = text(body.idToken, 4000);
      if (!token) return fail("invalid_token");
      const payload = await verifyGoogleIdToken(token);
      if (!payload) return fail("invalid_token", 401);
      return resolveOAuthUser({
        provider: "google",
        providerAccountId: payload.sub,
        email: payload.email ?? null,
        emailVerified: payload.emailVerified ?? false,
        name: payload.name ?? null,
        image: payload.picture ?? null,
      });
    }
    default:
      return fail("unknown_provider", 404);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const tooMany = limited(req, "app-auth", 20, 15 * 60_000);
  if (tooMany) return tooMany;

  const { provider } = await ctx.params;
  const body = await readJson(req);
  const result = await signIn(provider, body);
  if (result instanceof Response) return result;

  const token = createAppSession(result, text(body.client, 80) ?? "ios");
  return Response.json({ ok: true, token, account: accountPayload(result) });
}
