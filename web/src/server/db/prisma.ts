/**
 * Prisma client singleton (server-only).
 * Schema: web/prisma/schema.prisma — edit content via `npm run db:studio`.
 *
 * Runtime legacy modules still use `getDb()` (node:sqlite) on the same file.
 * New features should prefer Prisma; both share SITE_DB / DATABASE_URL.
 */
import "server-only";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

/** Absolute file: URL so query engine does not depend on cwd vs schema path. */
function ensureDatabaseUrl(): void {
  if (process.env.DATABASE_URL?.startsWith("file:")) {
    const raw = process.env.DATABASE_URL.slice("file:".length);
    if (raw.startsWith("/")) return;
  }
  const absolute =
    process.env.SITE_DB ??
    process.env.PHRASE_GAME_DB ??
    join(process.cwd(), "data", "phrase-game.sqlite");
  process.env.DATABASE_URL = `file:${absolute}`;
}

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === "1" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
