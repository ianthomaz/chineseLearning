/**
 * GET /api/app/content/pack/library — full library snapshot JSON (Bearer).
 * Contract: APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md
 */
import { NextResponse } from "next/server";
import { requireAppLibraryAccess } from "@/server/app-library/auth";
import { readMeta, readPackBytes } from "@/server/app-library/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAppLibraryAccess(req);
  if (denied) return denied;

  const meta = readMeta();
  const bytes = readPackBytes();
  if (!meta || !bytes) {
    return NextResponse.json(
      {
        error: "snapshot_missing",
        message: "Run npm run build:app-library on the server",
      },
      { status: 503 },
    );
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Version": String(meta.contentVersion),
      "X-Content-SHA256": meta.sha256,
    },
  });
}
