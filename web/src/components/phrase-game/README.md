# Quebra-Cabeça de Frases (phrase-builder game)

Drag-and-drop sentence builder at route **`/phrase-game`** (served as `/aulaChines/phrase-game`).
Players assemble a Chinese sentence from word/character pieces using
[`@dnd-kit`](https://dndkit.com/) (pointer drag + keyboard nudge). Guest play works on static export;
Google sign-in (server mode) + optional nick.

**Docs:** [docs/08_plano_jogo_frases.md](../../../../docs/08_plano_jogo_frases.md) (estado) ·
[docs/phrase-game-upgrades.md](../../../../docs/phrase-game-upgrades.md) (backlog) ·
[docs/phrase-game-scoring.md](../../../../docs/phrase-game-scoring.md) (pontuação)

## Layout

```
FRASES_GAME/
  schema.json                 canonical dataset schema (v2)
  curated/
    phrases.json              core hand-authored phrases
    expansion-01 … 07.json      themed batches (merged at build)
web/
  scripts/build-phrase-game-data.mjs   validator + build (curated → runtime artifact)
  src/data/phrase-game/phrases.json    GENERATED (596 phrases — do not hand-edit)
  src/lib/phrase-game/
    types.ts              Phrase, Token, GameLevel, DisplaySettings, ROUND_SIZE
    phrases.ts            loader for generated JSON
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
    AuthPanel.tsx         guest / Google / nick
    PhraseGameSession.tsx SessionProvider (route-scoped)
  src/server/             server-only (not in static export)
    auth/                 Auth.js v5 + google-onetap provider
    db/                   SQLite players + progress stub
```

Legacy `FRASES_GAME/Nivel*` and `all-phrases.json` are **not** consumed by the build.

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

1. Edit `FRASES_GAME/curated/phrases.json` and/or `expansion-*.json`.
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

OAuth setup: [docs/09_google_auth_jogo.md](../../../../docs/09_google_auth_jogo.md).

## Static export

`build:webplace` sets `NEXT_PUBLIC_AUTH_ENABLED=0`. Auth routes use `route.server.ts` and are
omitted from static export. Guest-only UI on webplace; server build keeps full auth.
