"use client";

import { SessionProvider } from "next-auth/react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";

/** Wraps the game in a NextAuth SessionProvider (skipped on static export). */
export function PhraseGameSession({ children }: { children: React.ReactNode }) {
  if (!AUTH_ENABLED) return <>{children}</>;
  return <SessionProvider basePath={`${BASE_PATH}/api/auth`}>{children}</SessionProvider>;
}
