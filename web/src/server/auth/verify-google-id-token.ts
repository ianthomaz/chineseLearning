import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleIdPayload = {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  picture?: string;
};

/**
 * Client ids whose ID tokens we accept: the web client (One Tap) and the iOS
 * client (`GOOGLE_IOS_CLIENT_ID`, native Google Sign-In in the app).
 */
export function googleAudiences(): string[] {
  return [
    process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
  ].filter((v): v is string => Boolean(v));
}

/** Verify a Google ID token (One Tap on the site, Google Sign-In in the app). */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdPayload | null> {
  const audience = googleAudiences();
  if (audience.length === 0) return null;

  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
    });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      emailVerified: payload.email_verified === true || payload.email_verified === "true",
      name: typeof payload.name === "string" ? payload.name : undefined,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  } catch {
    return null;
  }
}
