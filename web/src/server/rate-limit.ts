/**
 * Tiny in-memory fixed-window rate limiter (per server process).
 *
 * Enough to blunt scripted floods against the public, unauthenticated event-log
 * endpoint on a single long-running Node server (PM2 `next start`). Not a
 * distributed limiter — state is per process and resets on restart.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Returns true if this hit is allowed; false once `limit` is exceeded in the window. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) prune(now);
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}
