/** Small helpers for JSON route handlers. */
import { rateLimit } from "@/server/rate-limit";

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = (await req.json().catch(() => null)) as unknown;
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

/** Per-IP fixed window; returns a 429 Response when exceeded, else null. */
export function limited(req: Request, bucket: string, limit: number, windowMs: number): Response | null {
  if (rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs)) return null;
  return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
}

export function fail(error: string, status = 400): Response {
  return Response.json({ ok: false, error }, { status });
}
