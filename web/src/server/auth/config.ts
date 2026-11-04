/** Auth.js v5 base config (no DB imports — safe to share). */
import type { NextAuthConfig } from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import { appleCheckCookies, appleClientSecret } from "./apple-secret";
import { getAuthBasePath } from "./base-path";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

/** Signed once at start-up from the .p8 key (see apple-secret.ts). */
const APPLE_SECRET = appleClientSecret();
const SECURE = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://");

export const authConfig = {
  /** Must match public URL (`/api/auth`), not NEXTAUTH_URL pathname alone. */
  basePath: getAuthBasePath(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
    }),
    // Sign in with Apple on the site — on as soon as the Services ID and the
    // .p8 key are in the environment (docs/05_autenticacao.md § Apple no site).
    ...(process.env.AUTH_APPLE_ID && APPLE_SECRET
      ? [Apple({ clientId: process.env.AUTH_APPLE_ID, clientSecret: APPLE_SECRET })]
      : []),
  ],
  ...(APPLE_SECRET ? { cookies: appleCheckCookies(SECURE) } : {}),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: THIRTY_DAYS },
  trustHost: true,
} satisfies NextAuthConfig;
