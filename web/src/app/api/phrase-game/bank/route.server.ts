/**
 * Phrase bank API — SERVER MODE (`route.server.ts`; absent under static export).
 *
 * The bank is ~500 kB of JSON. Shipping it as props inlined it into the
 * `/phrase-game` first paint (656 kB of HTML) even though the setup screen needs
 * none of it. Serving it here lets the client pull it in the background while the
 * setup screen is already interactive, and lets the browser cache it across visits.
 *
 * Public on purpose: the game is playable as a guest.
 */
import { gzipSync } from "node:zlib";
import { getRuntimePhrases, PHRASE_BANK_VERSION } from "@/lib/phrase-game/phrases";

/**
 * `Response` only accepts a view backed by a plain `ArrayBuffer`; Node's `Buffer`
 * and `TextEncoder` are typed over `ArrayBufferLike`, so copy into a plain view.
 */
type Bytes = Uint8Array<ArrayBuffer>;

function toBytes(view: Uint8Array): Bytes {
  const out = new Uint8Array(view.byteLength);
  out.set(view);
  return out;
}

type BankPayload = {
  raw: Bytes;
  gzip: Bytes;
  etag: string;
};

/**
 * Serialised and compressed once per process — the bank only changes on restart.
 * Next's own compression does not kick in for route-handler responses, and 500 kB
 * of JSON over the wire defeats the point of moving it off the first paint.
 */
let payload: BankPayload | null = null;

function bankPayload(): BankPayload {
  if (payload) return payload;
  const phrases = getRuntimePhrases();
  const json = JSON.stringify({
    version: PHRASE_BANK_VERSION,
    count: phrases.length,
    phrases,
  });
  const raw = toBytes(new TextEncoder().encode(json));
  payload = {
    raw,
    gzip: toBytes(gzipSync(raw, { level: 9 })),
    // Length + count is enough to invalidate on a reseed; the bank is not
    // user-specific, so a strong hash would only cost startup time.
    etag: `W/"pg-${PHRASE_BANK_VERSION}-${phrases.length}-${raw.length}"`,
  };
  return payload;
}

export async function GET(req: Request) {
  const { raw, gzip, etag } = bankPayload();
  const acceptsGzip = (req.headers.get("accept-encoding") ?? "").includes("gzip");

  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    Vary: "Accept-Encoding",
    ETag: etag,
  });

  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  const body = acceptsGzip ? gzip : raw;
  if (acceptsGzip) headers.set("Content-Encoding", "gzip");
  headers.set("Content-Length", String(body.length));

  return new Response(body, { status: 200, headers });
}
