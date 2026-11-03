/** Auth.js v5 base config (no DB imports — safe to share). */
import type { NextAuthConfig } from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import { getAuthBasePath } from "./base-path";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const authConfig = {
  /** Must match public URL (`/api/auth`), not NEXTAUTH_URL pathname alone. */
  basePath: getAuthBasePath(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
    }),
    // Sign in with Apple on the site — only once the Services ID and its client
    // secret exist (`node scripts/apple-client-secret.mjs`, renew every 6 months).
    ...(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET
      ? [Apple({ clientId: process.env.AUTH_APPLE_ID, clientSecret: process.env.AUTH_APPLE_SECRET })]
      : []),
  ],
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: THIRTY_DAYS },
  trustHost: true,
} satisfies NextAuthConfig;
