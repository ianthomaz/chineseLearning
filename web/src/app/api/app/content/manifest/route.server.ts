/**
 * GET /api/app/content/manifest — app library version check (Bearer).
 * Contract: APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md
 */
import { NextResponse } from "next/server";
import { requireAppLibraryAccess } from "@/server/app-library/auth";
import {
  buildManifestFromMeta,
  readMeta,
} from "@/server/app-library/store";

export const dynamic = "force-dynamic";

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

  return NextResponse.json(buildManifestFromMeta(meta), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
