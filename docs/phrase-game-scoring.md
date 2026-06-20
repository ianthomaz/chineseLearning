# Quebra-Cabeça de Frases — scoring rules (planned)

Status: **planned / encoded, not surfaced.** The MVP has **no scoring UI and no leaderboard**.
The rules below are implemented as a pure function in
[`web/src/lib/phrase-game/scoring.ts`](../web/src/lib/phrase-game/scoring.ts) (`computeScore`)
so they are encoded and testable, but nothing renders a score yet. Persisting and ranking
scores is **Phase 2** (see [`08_plano_jogo_frases.md`](08_plano_jogo_frases.md) and
[`09_google_auth_jogo.md`](09_google_auth_jogo.md)).

## Per-phrase score

Each phrase yields a score in `[0, 1]`. A round is 10 phrases (`ROUND_SIZE`).

A phrase scores **0** when any of these is true:

- the submitted answer is wrong (`correct === false`);
- the player submitted a wrong answer at any point on this phrase (`wrongSubmit`);
- the "next piece" help was used to fill **every** slot (`nextPieceFilledAll`) — i.e. the
  whole sentence was auto-completed.

Otherwise the score is decided by the **highest help level used** (help is cumulative —
the most expensive hint used on the phrase wins; using a cheaper hint afterwards never
raises the score back up):

| Help level | Action (`HelpAction`)        | Score |
|-----------:|------------------------------|------:|
| 0          | none                         | 1.00  |
| 1          | `removeExtras` (remove distractors) | 1.00  |
| 2          | `showPinyin`                 | 0.75  |
| 3          | `showTranslation`            | 0.50  |
| 4          | `nextPiece` (partial)        | 0.25  |

Notes:

- **Removing extra pieces is free** (level 1 → 1.00). It only undoes optional added
  difficulty, so it carries no penalty.
- `nextPiece` used for *some* slots but with the player completing the rest scores 0.25;
  used for *all* slots it is treated as giving up → 0 (see `nextPieceFilledAll`).
- The mapping lives in `SCORE_BY_HELP_LEVEL = [1.0, 1.0, 0.75, 0.5, 0.25]`, indexed by the
  highest `HELP_LEVEL` reached.

## Round score

The round score is the sum (or mean) of the 10 per-phrase scores. The MVP only counts raw
correct/wrong for the progress dots and the "X de 10" summary; the weighted score above is
not displayed.

## Phase 2 (not in this change)

- Persist per-phrase and per-round scores server-side, keyed by `userId`
  (`GET/POST /aulaChines/api/game/progress`, SQLite `progress` table — schema stub only today).
- History, streaks and an optional ranking.
- Surface the weighted score in the round-complete screen.

When Phase 2 lands, update this document and `scoring.ts` together so the rules stay in sync.
