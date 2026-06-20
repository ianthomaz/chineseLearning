# Quebra-Cabeça de Frases (phrase-builder game)

Drag-and-drop sentence builder at route **`/phrase-game`** (served as `/aulaChines/phrase-game`).
Players assemble a Chinese sentence from word/character pieces using
[`@dnd-kit`](https://dndkit.com/) (pointer drag + keyboard nudge). Guest play is fully static;
optional Google sign-in (server mode) remembers a nickname.

## Layout

```
FRASES_GAME/
  schema.json                 canonical dataset schema (v2)
  curated/phrases.json        hand-authored source bank (edit this)
web/
  scripts/build-phrase-game-data.mjs   validator + build (curated → runtime artifact)
  src/data/phrase-game/phrases.json    GENERATED runtime artifact (do not hand-edit)
  src/lib/phrase-game/        pure game logic (no React, strict TS, no `any`)
    types.ts        core types (Phrase, Token, Piece, GameLevel, DisplaySettings, ROUND_SIZE)
    phrases.ts      typed loader for the generated JSON
    select-phrases.ts  build a 10-phrase round (tier + token-count band, distractor budget)
    pieces.ts       derive draggable pieces per level (whole-word L1–3, split L4, full L5)
    validate.ts     compare the answer strip to the canonical hanzi / respostasAceitas
    display.ts      pinyin/gloss reveal + locale-aware prompt
    scoring.ts      planned score (see docs/phrase-game-scoring.md — no UI yet)
  src/components/phrase-game/ React UI (client)
    PhraseGame.tsx       state machine: setup → playing → roundComplete
    SetupScreen.tsx      tier / level / difficulty-extras pickers
    GameplayScreen.tsx   board + submit/next + in-phrase help
    Board.tsx            @dnd-kit board (bank ↔ answer, mid-strip reorder, keyboard ◀▶)
    PieceCard.tsx        presentational piece (hanzi + optional pinyin/gloss)
    ProgressDots.tsx     2×5 round progress
    AuthPanel.tsx        Google sign-in + nick editor (degrades to guest on static)
    PhraseGameSession.tsx  next-auth SessionProvider, scoped to this route only
  src/server/            server-only (never bundled into the static export)
    auth/                Auth.js v5 instance + Google provider config
    db/                  node:sqlite players/progress layer (DB at web/data/, gitignored)
```

### Format decision

- **Content → static JSON.** Read-only, matches the rest of the site, and keeps the game
  playable under static export. Curated source is validated at prebuild and emitted to
  `src/data/phrase-game/phrases.json`.
- **Player data → SQLite** (`node:sqlite`, Node ≥ 22.5 — no native build), server mode only.
  Content is never stored in SQL.

## Editing / building the bank

1. Edit `FRASES_GAME/curated/phrases.json` (core) and/or `expansion-*.json` batches (hand-reviewed; merged at build time).
2. Rebuild + validate:
   ```bash
   cd web
   npm run prebuild:phrase-game     # node scripts/build-phrase-game-data.mjs
   ```
   The validator fills per-character pinyin (`pinyin-pro`), enforces the schema and the max-2
   cap, cross-checks tiers against `vocabulario/vocab-basico.json`, and rejects trivial
   distractor collisions. It is wired into `predev`, `prebuild` and `prebuild:pdf`, so a normal
   `npm run dev` / `build:*` always regenerates the artifact. `WARN` lines (e.g. a compound
   token not individually flagged HSK1) are non-fatal; `errors` abort the build.

## Running locally

| Mode | Command | Port | OAuth |
|------|---------|-----:|-------|
| Dev | `npm run dev` | 34827 | yes (with env) |
| Local Node | `./start.sh --local` | 34902 | yes (with env) |
| Static only | `npm run build:webplace` → `./start.sh --webplace` | 34901 | no (guest only) |

### Google OAuth (server mode)

Credentials live outside git (`local/credentials/credentials.json`). Generate the env files
and merge them — see [`docs/09_google_auth_jogo.md`](../../../../docs/09_google_auth_jogo.md):

```bash
node scripts/sync-env-from-credentials.mjs                     # from repo root
cat local/credentials/generated/web.auth.env.local >> web/.env.local
cat local/credentials/generated/deploy.auth.env   >> web/deploy/server.env
```

`NEXTAUTH_URL` host+port must match the browser (`127.0.0.1` ≠ `localhost` for Google), and the
matching redirect URI must be registered on the GCP **ChineseSite** client.

## Static export note

`build:webplace` runs with `NEXT_STATIC_EXPORT=1 NEXT_PUBLIC_AUTH_ENABLED=0`. There is no server,
so the API routes must not exist. The auth/progress handlers are named **`route.server.ts`** and
`next.config.ts` `pageExtensions` only treats `.server.ts` as a route in server mode — under
static export those files are not routes (the routes simply vanish, so `output: 'export'` never
sees a dynamic route handler). The UI then renders guest-only via `NEXT_PUBLIC_AUTH_ENABLED=0`.
Both `npm run build:server` (auth live) and `npm run build:webplace` (guest static) must stay green.
