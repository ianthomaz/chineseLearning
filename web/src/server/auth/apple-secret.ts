/**
 * Sign in with Apple on the site — configuration from the environment.
 *
 * Apple's "client secret" is a JWT signed with the team's .p8 key, valid at
 * most 6 months. Instead of pasting one that expires, the server signs a fresh
 * one at start-up from the key itself (every deploy restarts the server).
 * A pasted `AUTH_APPLE_SECRET` still works and wins.
 *
 * Env: AUTH_APPLE_ID (Services ID, e.g. today.learnchinese.web),
 *      AUTH_APPLE_TEAM_ID, AUTH_APPLE_KEY_ID, AUTH_APPLE_PRIVATE_KEY (PEM, "\n" escaped ok).
 */
import { createPrivateKey, createSign } from "node:crypto";

const MAX_AGE_S = 180 * 24 * 60 * 60;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** ES256 JWT for Apple's token endpoint, or null when the key is not configured. */
export function appleClientSecret(now = Math.floor(Date.now() / 1000)): string | null {
  const clientId = process.env.AUTH_APPLE_ID?.trim();
  if (!clientId) return null;
  const pasted = process.env.AUTH_APPLE_SECRET?.trim();
  if (pasted) return pasted;

  const teamId = process.env.AUTH_APPLE_TEAM_ID?.trim();
  const keyId = process.env.AUTH_APPLE_KEY_ID?.trim();
  const pem = process.env.AUTH_APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!teamId || !keyId || !pem) return null;

  try {
    const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
    const payload = b64url(
      JSON.stringify({
        iss: teamId,
        iat: now,
        exp: now + MAX_AGE_S,
        aud: "https://appleid.apple.com",
        sub: clientId,
      }),
    );
    const signer = createSign("SHA256");
    signer.update(`${header}.${payload}`);
    signer.end();
    // JWS wants the raw r||s signature, not DER.
    const signature = signer.sign({ key: createPrivateKey(pem), dsaEncoding: "ieee-p1363" });
    return `${header}.${payload}.${b64url(signature)}`;
  } catch (err) {
    console.warn("[apple] could not sign client secret", err instanceof Error ? err.name : "error");
    return null;
  }
}

/**
 * Apple answers with a cross-site POST (`response_mode=form_post`), and
 * SameSite=Lax cookies are not sent on it — Auth.js would lose its PKCE /
 * state / nonce check and fail the sign-in. Those three cookies go out as
 * SameSite=None (HTTPS only; Apple requires an HTTPS return URL anyway).
 */
export function appleCheckCookies(secure: boolean) {
  if (!secure) return undefined;
  const options = { httpOnly: true, sameSite: "none" as const, path: "/", secure: true };
  return {
    pkceCodeVerifier: { name: "__Secure-authjs.pkce.code_verifier", options },
    state: { name: "__Secure-authjs.state", options },
    nonce: { name: "__Secure-authjs.nonce", options },
  };
}
