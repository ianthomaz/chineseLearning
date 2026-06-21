# Phrase Game — event log & backoffice

A server-side history of gameplay for the **Quebra-Cabeça de Frases** game, plus
an owner-only backoffice to read it. Captures **logged-in and anonymous** players.

## What is logged

One row per event in the SQLite `events` table (see `web/src/server/db/index.ts`):

| event            | when                                   | key fields                     |
|------------------|----------------------------------------|--------------------------------|
| `game_enter`     | the game page mounts                    | anon/user id                   |
| `round_start`    | a round begins                          | tier, level, round id          |
| `phrase_result`  | a phrase is submitted                   | phrase id, correct, attempt    |
| `help_used`      | an in-phrase hint is used               | phrase id, detail (action)     |
| `round_abandon`  | the player leaves mid-round             | detail (`reached:3/10`)        |
| `round_complete` | the round finishes                      | detail (`7/10`)                |

Every row also stores: `created_at`, `user_id` (Google sub, when signed in),
`anon_id` (per-browser uuid in `localStorage`), `round_id`, `locale`,
`user_agent`. No IP is stored.

## How it flows

- **Client** — `web/src/lib/phrase-game/game-log.ts` posts events to
  `POST /api/game/events`. It is gated on `NEXT_PUBLIC_AUTH_ENABLED`, so it
  **no-ops under static export** (no server) and runs in server mode / dev.
  `keepalive` lets abandon events flush during navigation/unload.
- **API** — `web/src/app/api/game/events/route.server.ts` (server-mode route).
  Attaches the signed-in `user_id` from the session; the client only supplies the
  anonymous id. Best-effort, never blocks gameplay.
- **Storage** — `web/src/server/db/events.ts` (`recordEvent`, `recentEvents`,
  `eventStats`) on the existing `node:sqlite` connection.

## Backoffice (owner)

`/aulaChines/backoffice` — server-rendered, **admin-gated**, absent on static
export (`page.server.tsx`). Shows summary cards (rounds, completes, abandons,
correct/wrong, distinct players/guests) and the 200 most recent events.

**Access:** the signed-in Google account email must be in `ADMIN_EMAIL`
(comma-separated) in `deploy/server.env`. Defaults to the repo owner if unset.

```
ADMIN_EMAIL=you@example.com,teammate@example.com
```

## Requirements / notes

- **Server mode only** (`build:server` + `next start` / PM2). The static
  `build:webplace` has no API and no backoffice — gameplay still works, just
  unlogged.
- DB file: `web/data/phrase-game.sqlite` (or `PHRASE_GAME_DB`). Gitignored.
- Future (see `docs/phrase-game-upgrades.md`): let signed-in players see their
  own history, and derive scoring/ranking from these rows.
