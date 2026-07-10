"use client";

import { SessionProvider } from "next-auth/react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";

/** Site-wide NextAuth session (skipped when auth is disabled, e.g. static export). */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  if (!AUTH_ENABLED) return <>{children}</>;
  return <SessionProvider basePath={`${BASE_PATH}/api/auth`}>{children}</SessionProvider>;
}
