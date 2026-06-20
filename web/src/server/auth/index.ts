/**
 * Auth.js v5 instance (server-only — imports the SQLite layer).
 *
 * On sign-in we record a minimal player row. We do NOT persist round scores yet
 * (that is Phase 2 — see docs/phrase-game-scoring.md).
 */
import NextAuth from "next-auth";
import { authConfig } from "./config";
import { upsertPlayer } from "@/server/db/players";

/** Google's stable user id is the OIDC `sub` claim. */
function profileSub(profile: unknown): string | undefined {
  if (profile && typeof profile === "object" && "sub" in profile) {
    const sub = (profile as { sub?: unknown }).sub;
    if (typeof sub === "string") return sub;
  }
  return undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    jwt({ token, profile }) {
      const sub = profileSub(profile);
      if (sub) token.sub = sub;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
    signIn({ user, profile }) {
      try {
        const id = profileSub(profile) ?? user?.id;
        if (id) {
          upsertPlayer({ id, email: user?.email, name: user?.name, image: user?.image });
        }
      } catch {
        /* best-effort — auth must not fail if the DB write does */
      }
      return true;
    },
  },
});
