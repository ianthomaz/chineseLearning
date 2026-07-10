/**
 * Auth.js v5 instance (server-only — imports the SQLite layer).
 *
 * On sign-in we record a minimal player row. We do NOT persist round scores yet
 * (that is Phase 2 — see docs/phrase-game-scoring.md).
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./config";
import { upsertUser } from "@/server/db/users";
import { verifyGoogleIdToken } from "./verify-google-id-token";

/** Google's stable user id is the OIDC `sub` claim. */
function profileSub(profile: unknown): string | undefined {
  if (profile && typeof profile === "object" && "sub" in profile) {
    const sub = (profile as { sub?: unknown }).sub;
    if (typeof sub === "string") return sub;
  }
  return undefined;
}

function userId(user: { id?: string } | undefined, profile: unknown): string | undefined {
  return user?.id ?? profileSub(profile);
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
        return {
          id: payload.sub,
          email: payload.email ?? null,
          name: payload.name ?? null,
          image: payload.picture ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, profile }) {
      const id = userId(user, profile);
      if (id) token.sub = id;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
    signIn({ user, profile }) {
      try {
        const id = userId(user, profile);
        if (id) {
          upsertUser({ id, email: user?.email, name: user?.name, image: user?.image });
        }
      } catch {
        /* best-effort — auth must not fail if the DB write does */
      }
      return true;
    },
  },
});
