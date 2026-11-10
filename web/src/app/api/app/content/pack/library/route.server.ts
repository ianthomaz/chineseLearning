/**
 * GET /api/app/content/pack/library — full library snapshot JSON (Bearer).
 * Contract: appMobile/docs/03_contratoAtualizacaoAPP.md
 */
import { gzipSync } from "node:zlib";
import { NextResponse } from "next/server";
import { requireAppLibraryAccess } from "@/server/app-library/auth";
import { readMeta, readPackBytes } from "@/server/app-library/store";

export const dynamic = "force-dynamic";

type Bytes = Uint8Array<ArrayBuffer>;

function toBytes(view: Uint8Array): Bytes {
  const out = new Uint8Array(view.byteLength);
  out.set(view);
  return out;
}

let cached: { sha256: string; raw: Bytes; gzip: Bytes } | null = null;

export async function GET(req: Request) {
  const denied = requireAppLibraryAccess(req);
  if (denied) return denied;

  const meta = readMeta();
  if (!meta) {
    return NextResponse.json(
      {
        error: "snapshot_missing",
        message: "Run npm run build:app-library on the server",
      },
      { status: 503 },
    );
  }

  if (!cached || cached.sha256 !== meta.sha256) {
    const bytes = readPackBytes();
    if (!bytes) {
      return NextResponse.json(
        {
          error: "snapshot_missing",
          message: "Run npm run build:app-library on the server",
        },
        { status: 503 },
      );
    }
    const raw = toBytes(bytes);
    cached = {
      sha256: meta.sha256,
      raw,
      gzip: toBytes(gzipSync(raw, { level: 9 })),
    };
  }

  const acceptsGzip = (req.headers.get("accept-encoding") ?? "").includes("gzip");
  const body = acceptsGzip ? cached.gzip : cached.raw;
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Accept-Encoding",
    "X-Content-Version": String(meta.contentVersion),
    "X-Content-SHA256": meta.sha256,
    "Content-Length": String(body.length),
  });
  if (acceptsGzip) headers.set("Content-Encoding", "gzip");

  return new NextResponse(body, { status: 200, headers });
}
