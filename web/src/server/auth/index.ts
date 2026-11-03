/**
 * Auth.js v5 instance (server-only — imports the SQLite layer).
 *
 * Every way in resolves to one internal `users.id` through the `accounts`
 * table (`server/db/identity.ts`): Google (redirect + One Tap), Apple (when
 * configured), and email + password. `token.sub` is that internal id.
 */
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./config";
import { verifyGoogleIdToken } from "./verify-google-id-token";
import { passwordSignIn } from "@/server/account/service";
import { getIdentityUser, resolveOAuthUser } from "@/server/db/identity";

/** Surfaced to the client as `signIn(...).code`. */
class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

type OAuthProfile = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  picture?: unknown;
};

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "google-onetap",
      credentials: { credential: { label: "Credential", type: "text" } },
      async authorize(credentials) {
        const raw = credentials?.credential;
        if (typeof raw !== "string") return null;
        const payload = await verifyGoogleIdToken(raw);
        if (!payload) return null;
        const id = resolveOAuthUser({
          provider: "google",
          providerAccountId: payload.sub,
          email: payload.email ?? null,
          emailVerified: payload.emailVerified ?? false,
          name: payload.name ?? null,
          image: payload.picture ?? null,
        });
        const user = getIdentityUser(id);
        return { id, email: user?.email ?? null, name: user?.name ?? null, image: user?.image ?? null };
      },
    }),
    Credentials({
      id: "password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = await passwordSignIn(credentials?.email, credentials?.password);
        if (!result.ok) {
          if (result.error === "email_not_verified") throw new EmailNotVerified();
          return null;
        }
        const user = getIdentityUser(result.userId);
        return {
          id: result.userId,
          email: user?.email ?? null,
          name: user?.name ?? user?.nick ?? null,
          image: user?.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, account, profile }) {
      // OAuth redirect sign-in (google, apple): map the provider identity.
      if (account && (account.provider === "google" || account.provider === "apple")) {
        const p = (profile ?? {}) as OAuthProfile;
        const providerAccountId = account.providerAccountId || str(p.sub);
        if (providerAccountId) {
          try {
            token.sub = resolveOAuthUser({
              provider: account.provider,
              providerAccountId,
              email: str(p.email) ?? user?.email ?? null,
              emailVerified: p.email_verified === true || p.email_verified === "true",
              name: str(p.name) ?? user?.name ?? null,
              image: str(p.picture) ?? user?.image ?? null,
            });
          } catch (err) {
            console.warn("[auth] could not resolve OAuth user", err);
          }
          return token;
        }
      }
      // Credentials providers already return the internal id.
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
});
