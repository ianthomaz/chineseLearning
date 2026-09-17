# Quebra-Cabeça de Frases (phrase-builder game)

Drag-and-drop sentence builder at route **`/phrase-game`**.
Players assemble a Chinese sentence from word/character pieces using
[`@dnd-kit`](https://dndkit.com/) (pointer drag + keyboard nudge). No login required: the route has no gate in either build mode.
Google sign-in (server mode) is optional and only stores a nick.

**Docs:** [docs/06_jogo_frases.md](../../../../docs/06_jogo_frases.md)

## Layout

```
FRASES_GAME/
  schema.json                 canonical dataset schema (v2)
  curated/
    phrases.json              the phrase bank (edit this)
web/
  scripts/build-phrase-game-data.mjs   validator + build (curated → runtime artifact)
  src/data/phrase-game/phrases.json    GENERATED — do not hand-edit; seeds SQLite
  src/lib/phrase-game/
    types.ts              Phrase, Token, GameLevel, DisplaySettings, ROUND_SIZE
    phrases.ts            server-side bank loader (SQLite, memoised)
    use-phrase-bank.ts    client hook: background fetch of /api/phrase-game/bank
    select-phrases.ts     tier filter + weighted length mix + distractor budget
    settings-by-level.ts  hint toggles clamped by game level
    pieces.ts             draggable pieces (whole-word L1–3, split L4, full L5)
    validate.ts           answer strip vs hanzi / respostasAceitas
    display.ts            pinyin/gloss reveal + localized prompt
    scoring.ts            weighted score (no UI yet)
  src/components/phrase-game/
    PhraseGame.tsx        setup → playing → roundComplete (+ miss review)
    SetupScreen.tsx       tier / level / extras
    GameplayScreen.tsx    board + submit/next + in-phrase help
    Board.tsx             @dnd-kit (bank ↔ answer, keyboard ◀▶)
    GoogleOneTap.tsx      GIS One Tap + sign-in button
    AuthPanel.tsx         optional Google sign-in / nick (below the setup screen)
    PhraseGameSession.tsx SessionProvider (route-scoped)
  src/app/api/phrase-game/bank/route.server.ts
                          serves the bank (gzipped + ETag) so it is not in the
                          first paint; static export falls back to props
  src/server/             server-only (not in static export)
    auth/                 Auth.js v5 + google-onetap provider
    db/                   SQLite users + events + progress stub
```

## Game rules (code)

| Config | Behaviour |
|--------|-----------|
| Tier Iniciante | `tier === hsk1` only; UI levels 1–2 |
| Tier Básico | full bank; UI levels 1–5 |
| Level 1 | sample: 100% short (≤3 tokens) |
| Level 2 | 25% short / 75% medium (≤5 tokens); translation-on-difficult allowed |
| Levels 3–5 | weighted mix (`ROUND_MIX_WEIGHTS`); short phrases can still appear |
| Max distractors | 2 globally |

## Editing / building the bank

1. Edit `FRASES_GAME/curated/phrases.json`.
2. Tags: use themes (`tema:cores`, `tema:lugares`, …), not source PDF names.
3. Rebuild:
   ```bash
   cd web
   npm run prebuild:phrase-game
   ```
   Runs on `predev` / `prebuild` automatically. `WARN` = non-fatal; `errors` abort.

## Running locally

| Mode | Command | Port | OAuth |
|------|---------|-----:|-------|
| Dev | `./start.sh` or `npm run dev` | 34827 | yes (with env) |
| Local Node | `./start.sh --local` | 34902 | yes |
| Static | `./start.sh --webplace` | 34901 | no (guest) |

OAuth setup: [docs/05_autenticacao.md](../../../../docs/05_autenticacao.md). Session is site-wide via `AuthSessionProvider` in root `Providers.tsx`.

## Static export

`build:webplace` sets `NEXT_PUBLIC_AUTH_ENABLED=0`. Auth routes use `route.server.ts` and are
omitted from static export. Guest-only UI on webplace; server build keeps full auth.
