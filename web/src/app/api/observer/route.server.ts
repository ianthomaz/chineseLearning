/**
 * Observer API — Read-only diagnostic and analytics portal for authorized
 * external AI agents and monitors.
 *
 * Auth:
 * - Header `Authorization: Bearer <OBSERVER_API_KEY>` or `x-observer-key: <OBSERVER_API_KEY>`
 * - Environment variable: `OBSERVER_API_KEY` (or `OBSERVER_TOKEN`)
 *
 * Rules:
 * - Server-only route (`route.server.ts`), omitted under static export.
 * - Strict read-only access.
 * - Sensitive columns (`password_hash`, `token_hash`, internal NOIA levels) are sanitized.
 */
import { timingSafeEqual } from "node:crypto";
import { getObserverOverview, getObserverTable } from "@/server/db/observer";

export const dynamic = "force-dynamic";

function extractKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  const custom = req.headers.get("x-observer-key");
  if (custom) return custom.trim();

  // Allow URL query param ?key=... only in local dev
  if (process.env.NODE_ENV !== "production") {
    const url = new URL(req.url);
    const qKey = url.searchParams.get("key");
    if (qKey) return qKey.trim();
  }

  return null;
}

function verifyKey(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(req: Request) {
  const configuredKey = process.env.OBSERVER_API_KEY || process.env.OBSERVER_TOKEN;
  if (!configuredKey) {
    return Response.json(
      { error: "observer_disabled", message: "OBSERVER_API_KEY is not configured on this server." },
      { status: 503 }
    );
  }

  const providedKey = extractKey(req);
  if (!providedKey || !verifyKey(providedKey, configuredKey)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "overview";

  if (view === "table") {
    const table = url.searchParams.get("name") || url.searchParams.get("table");
    if (!table) {
      return Response.json({ error: "missing_table_name" }, { status: 400 });
    }
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;
    const offset = url.searchParams.get("offset") ? Number(url.searchParams.get("offset")) : undefined;
    const res = getObserverTable(table, { limit, offset });
    if ("error" in res) {
      return Response.json({ error: res.error }, { status: 400 });
    }
    return Response.json(res);
  }

  // Default: Overview
  return Response.json(getObserverOverview());
}
