import { createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export type AppleIdPayload = {
  sub: string;
  email?: string;
  emailVerified: boolean;
  isPrivateEmail: boolean;
};

/**
 * Audiences for Sign in with Apple ID tokens: the iOS bundle id, plus the web
 * Services ID when the site offers Apple too. Same team ⇒ same `sub` on both,
 * as long as the Services ID is grouped with the app's primary App ID.
 */
export function appleAudiences(): string[] {
  return [process.env.APPLE_APP_BUNDLE_ID || "today.learnchinese.app", process.env.AUTH_APPLE_ID].filter(
    (v): v is string => Boolean(v),
  );
}

/**
 * Verify an identity token from the app's Sign in with Apple. `rawNonce` is
 * the nonce the app generated; Apple stores its SHA-256 in the token.
 */
export async function verifyAppleIdToken(
  identityToken: string,
  rawNonce?: string | null,
): Promise<AppleIdPayload | null> {
  try {
    const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience: appleAudiences(),
    });
    if (typeof payload.sub !== "string") return null;
    if (rawNonce) {
      const expected = createHash("sha256").update(rawNonce).digest("hex");
      if (payload.nonce !== expected) return null;
    }
    const flag = (v: unknown) => v === true || v === "true";
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      emailVerified: flag(payload.email_verified),
      isPrivateEmail: flag(payload.is_private_email),
    };
  } catch {
    return null;
  }
}
