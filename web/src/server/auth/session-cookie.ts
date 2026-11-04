/**
 * Auth.js session cookie, written by flows that are not Auth.js providers.
 * Salt and name match `@auth/core` so `/api/auth/session` can read it.
 */
import { encode } from "next-auth/jwt";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export function authUsesSecureCookie(): boolean {
  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  return url.startsWith("https://");
}

export function authSessionCookieName(secure: boolean): string {
  return `${secure ? "__Secure-" : ""}authjs.session-token`;
}

export async function authSessionToken(userId: string, secure: boolean): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET missing");
  return encode({
    token: { sub: userId },
    secret,
    salt: authSessionCookieName(secure),
    maxAge: THIRTY_DAYS,
  });
}

export const AUTH_SESSION_MAX_AGE = THIRTY_DAYS;
