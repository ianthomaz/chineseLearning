/**
 * Auth.js v5 catch-all route — SERVER MODE.
 *
 * Selected by `next.config` `pageExtensions` only when NEXT_STATIC_EXPORT is unset
 * (`build:server`, `dev`). The static export build (`build:webplace`) picks
 * `route.export.ts` instead, so the real NextAuth handlers — and the SQLite layer they
 * import — are never bundled into `output: 'export'`. See docs/09_google_auth_jogo.md.
 */
import { handlers } from "@/server/auth";

export const { GET, POST } = handlers;
