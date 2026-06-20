/**
 * Auth.js v5 catch-all route — SERVER MODE.
 *
 * Selected by `next.config` `pageExtensions` only when NEXT_STATIC_EXPORT is unset
 * (`build:server`, `dev`). The static export build (`build:webplace`) picks
 * `route.export.ts` instead, so the real NextAuth handlers — and the SQLite layer they
 * import — are never bundled into `output: 'export'`. See docs/09_google_auth_jogo.md.
 */
import type { NextRequest } from "next/server";
import { handlers } from "@/server/auth";
import { prepareAuthRequest } from "@/server/auth/base-path";

async function handle(method: "GET" | "POST", req: NextRequest) {
  return handlers[method](prepareAuthRequest(req));
}

export const GET = (req: NextRequest) => handle("GET", req);
export const POST = (req: NextRequest) => handle("POST", req);
