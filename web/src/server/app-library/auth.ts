/**
 * Bearer auth + simple in-memory rate limit for app library API.
 * Env: APP_LIBRARY_TOKEN (personal v1 — align with app Keychain/build secret).
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientKey(req: Request, tokenFingerprint: string): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || "unknown";
  return `${ip}:${tokenFingerprint.slice(0, 8)}`;
}

function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= MAX_PER_WINDOW) return false;
  b.count += 1;
  return true;
}

function bearerMatches(header: string | null, expected: string): boolean {
  if (!header || !header.startsWith("Bearer ")) return false;
  const got = header.slice("Bearer ".length).trim();
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * @returns null if OK; otherwise a Response to return immediately.
 */
export function requireAppLibraryAccess(req: Request): Response | null {
  const expected = process.env.APP_LIBRARY_TOKEN?.trim() ?? "";
  if (!expected) {
    return NextResponse.json(
      {
        error: "app_library_misconfigured",
        message: "APP_LIBRARY_TOKEN is not set on the server",
      },
      { status: 503 },
    );
  }

  if (!bearerMatches(req.headers.get("authorization"), expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const key = clientKey(req, expected);
  if (!rateLimitOk(key)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  return null;
}
