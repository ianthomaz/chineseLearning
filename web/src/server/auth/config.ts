/** Auth.js v5 base config (no DB imports — safe to share). */
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: THIRTY_DAYS },
  trustHost: true,
} satisfies NextAuthConfig;
