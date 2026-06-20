# Phrase Builder Game — implementation spec

You are implementing a new game inside an existing Chinese-learning website. **Read the repo first** — stack, components, i18n, styling, deploy model, and existing content. Follow existing conventions. Do not invent parallel patterns.

## Mission

Build **“Organize as Frases”** (PT) / **“Coloque em Ordem”** — a drag-and-drop sentence builder where the user assembles Chinese sentences from shuffled pieces. One phrase at a time; 10 phrases per round.

This is a **new standalone game route**, not an extension of the existing quiz hub (`/gamification`). Reuse site-wide patterns (Tailwind tokens, `LocaleContext`, `trackEvent`, layout, nav) but implement fresh game UI and state.

## Authority to reorganize

The product owner does not care about current folder names. You **may and should** reorganize phrase data, lexicon references, game code, and DB paths into a clean layout. Treat these as **starting inputs**, not fixed contracts:

- `FRASES_GAME/` — phrase bank (`all-phrases.json`, per-level files, `schema.json`)
- `vocabulario/hsk1-reference.json` — 333 HSK1 words (blocks 1–16 + quiz bank)
- `vocabulario/vocab-basico.json` — 1052 entries; 324 with `hsk1: true`, ~728 implicit basic (HSK1+2) without flag
- `docs/09_google_auth_jogo.md` — Google OAuth plan (Auth.js v5, JWT session)
- `docs/08_plano_jogo_frases.md` — earlier plan (informative only; this prompt overrides)

Document your final layout in a short `README` next to the game module.

## Hard constraints

| Rule | Detail |
|------|--------|
| No LLM at runtime | Game reads static phrase data only |
| Max extra pieces | **Never more than 2** distractor pieces on any phrase, under any setting |
| Multilingual UI | Site is PT / EN / ES — all game chrome via existing i18n (`web/src/messages/*.json`) |
| OAuth needs server | Auth requires `build:server` + `next start`; static export cannot run OAuth (`docs/09_google_auth_jogo.md`) |
| MVP: no scoring UI | Do **not** implement leaderboard or point display yet — **document** scoring rules for a later phase |
| Code language | English (identifiers, comments, README). User-facing strings via i18n |

---

## 1. Player identity (MVP)

Implement per `docs/09_google_auth_jogo.md`:

- **Guest**: can play full rounds; persist only `localStorage` (session prefs, optional nick-less progress stub).
- **Logged-in (Google)**: Auth.js v5 + Google provider; session JWT ~30 days.
- **SQLite** database for players: `userId`, Google profile fields, **`nick`** (user-chosen display name, saved after first login or in a small profile step).
- API stub for future server progress (`GET/POST …/api/game/progress`) — schema only, minimal write on login/nick save; **do not** persist round scores yet.

Nick is cosmetic for now; ranking comes later.

---

## 2. Vocabulary tiers (phrase filtering)

Two playable language tiers on the setup screen:

| Tier | UI | Phrase filter |
|------|-----|---------------|
| **Iniciante** | enabled | Phrase must use **HSK1-only** vocabulary. Cross-check tokens against `hsk1-reference.json` / `vocab-basico.json` entries with `hsk1: true`. |
| **Básico** | enabled | Full basic lexicon (~HSK1+2): all of `vocab-basico.json`. |
| **Intermediário** | disabled (visible, greyed) | Future |
| **Avançado** | disabled (visible, greyed) | Future |

**“Difficult words”** (for optional pinyin/translation hints) = words belonging to **HSK2** / marked `dificil: true` on phrase tokens.

**Iniciante level cap**: can only select game **levels 1–2**. Levels 3–5 are disabled when Iniciante is selected.

Lexicon may stay JSON for MVP; SQLite migration for lexicon is optional later.

---

## 3. Setup screen (before PLAY)

Single configuration screen. After **PLAY**, go directly to phrase 1 — no intermediate splash.

### 3.1 Language tier
Radio: Iniciante | Básico | Intermediário* | Avançado* (*disabled)

### 3.2 Game level (difficulty)
Radio levels **1–5**:

| Level | Label (i18n key) | Phrase selection | Piece mechanics |
|-------|------------------|------------------|-----------------|
| **1** | Small phrases | Short sentences (~2–3 tokens) | Whole-word pieces |
| **2** | Up to ~5 words | Medium length (≤5 tokens) | Whole-word pieces |
| **3** | Complex sentence | Longer / compound (whole words only) | **No character splitting** — every multi-char word is one draggable piece |
| **4** | Larger + split | Longer phrases | **Partial split**: break **one or two** multi-char words into separate hanzi pieces (pick any suitable word per phrase — do not over-engineer). **Extras**: in a 10-phrase round, **exactly ~3 random phrases** receive **1** extra distractor piece; the other 7 have **zero** extras unless the user enabled the extras checkbox |
| **5** | All characters loose | Same pool as level 3–4 length | **Full split**: **every** token becomes individual hanzi pieces — **no pair appears joined** (e.g. 高兴 → 高 + 兴). **Extras**: **every** phrase gets **1 or 2** distractor pieces (never >2) |

Map phrase pool by **token count + tier filter**, not only by dataset `nivel` field if it diverges. Adapt/validate phrase JSON accordingly (max 2 distractors per entry — trim schema if needed).

### 3.3 Difficulty extras (checkboxes)

Shown on setup; **same toggles reachable mid-phrase** (adjustable per phrase). Defaults in bold:

- **[x] Hanzi only** (default display — pieces show hanzi only)
- **[ ] Add up to 2 extra hanzi** — optional distractors not part of the sentence (respect global max 2; stacks with level 4/5 rules within cap)
- **[ ] Pinyin on difficult words** — show pinyin on HSK2 / `dificil` tokens only
- **[ ] Hanzi + Pinyin** — show pinyin on all pieces
- **[ ] Translation on difficult words** — show PT gloss on difficult tokens only

Implement **sensible mutual exclusion** for display modes (e.g. “Hanzi + Pinyin” vs “Hanzi only”) without blocking valid combinations of hints + distractors.

### 3.4 PLAY button
Starts a **round** = **10 phrases** sampled from the filtered pool (no replacement within the round if pool allows; if pool too small, sample with replacement and log a dev warning).

---

## 4. Gameplay screen

### 4.1 Progress indicator
Top of screen: **2 rows × 5 circles** (10 total). Empty → pending; **green** = submitted correct; **red** = submitted wrong. Fill left-to-right as the round advances.

Show `phraseIndex / 10` subtly if helpful.

### 4.2 Prompt
Display the sentence prompt in the user’s locale. Phrase JSON currently has `pt`; extend or map to EN/ES using existing site patterns (fallback chain: locale → pt).

### 4.3 Drag-and-drop mechanics

Use **`@dnd-kit/core` + `@dnd-kit/sortable`** (touch-friendly) unless you find an equivalent already in the repo.

- **Two zones**: (1) **shuffled piece bank**, (2) **answer strip** where the sentence is built.
- True sortable: insert/reorder in the **middle** of the answer strip without resetting.
- Pieces can move **bank ↔ answer** freely before submit.
- Validation string = concatenate hanzi of pieces **in the answer strip only**, in order, no spaces. Compare to `hanzi` or `respostasAceitas[]`.
- At levels 4–5 (and when split toggles apply), derive pieces from each token’s `caracteres[]` array at runtime.

### 4.4 Actions

| Control | Behavior |
|---------|----------|
| **Submit** (`Enviar`) | Validate answer |
| **Correct** | Show success state; show **Next** (`Próxima`) button. Optional **auto-advance after 6s** (user can still click Next immediately) |
| **Wrong** | Show **correct hanzi sentence** for learning. **Do not** show pinyin or translation until user explicitly requests them. **No score penalty** for requesting hints after failure (they already lost). **Next** manual + optional 6s auto-advance |
| **Next** | Load next phrase; update progress dot |

### 4.5 In-phrase help (implement UI + hooks; scoring deferred)

Available **during** the phrase (before or after submit where noted):

1. **Remove extra pieces** — strips distractors from bank (only when extras exist). *Future score cost: none.*
2. **Show pinyin** — per difficult word or all words per active display toggles. *Future score cost: TBD.*
3. **Show translation** — difficult words or full per toggles. *Future score cost: TBD.*
4. **Next piece** — places **one** correct next piece into the answer strip per click until complete. *Future score rules (document, do not implement UI score yet): each use lowers points; using for every piece counts as failed attempt.*

After wrong submit, pinyin/translation requests are free (educational mode).

---

## 5. Scoring & ranking (document only — not MVP UI)

Create `docs/phrase-game-scoring.md` with **planned** rules (no user-facing score in MVP):

- Correct without help → 1.0
- Help tier degrades: after help 1 → 1.0; help 2 → 0.75; help 3 → 0.5; help 4 → 0.25
- Wrong submit or “next piece” used for all slots → 0
- Highest help level used on a phrase wins
- Ranking / leaderboard / persisted scores → **Phase 2** (SQLite tables stub OK)

---

## 6. Phrase data schema

Canonical shape in `FRASES_GAME/schema.json`. Required per phrase:

`id`, `nivel`, `pt`, `hanzi`, `pinyin`, `tokens[]`, `distratores[]` (0–2 items at runtime; dataset entries may carry candidates — pick ≤2)

Each token: `{ palavra, caracteres[{hanzi,pinyin}], pinyin, pt, dificil }`

Optional: `respostasAceitas[]`, `tags[]`

Add a **build-time validator** script: schema check, max 2 distractors, HSK tier tags, no distractor can form alternate valid sentence with answer tokens.

Wire validated output into `web/` (path of your choice) via `prebuild` if appropriate.

---

## 7. Integration checklist

- [ ] New route (you choose slug, e.g. `/phrase-game`) + entry in `SiteNav` and home if appropriate
- [ ] i18n keys in `pt.json`, `en.json`, `es.json`
- [ ] `trackEvent` — category `phrase_game`, actions: `round_start`, `phrase_submit`, `phrase_correct`, `phrase_wrong`, `help_used`, `round_complete`
- [ ] Mobile-first layout; match existing `--border`, `text-ink`, `rounded-2xl` patterns
- [ ] Auth button on game page (Google sign-in); nick editor for logged-in users
- [ ] SQLite + migrations in a dedicated folder (e.g. `web/data/` or `web/src/server/db/`)
- [ ] Auth routes under `/aulaChines/api/auth` respecting `basePath`
- [ ] README: how to run locally with OAuth (port 34827 / 34902), env sync script, phrase validation

---

## 8. Explicitly out of scope (MVP)

- LLM generation or runtime AI
- Leaderboard / visible points
- Intermediário / Avançado tiers
- Auto level progression
- Migrating lexicon to SQLite (optional later)
- Replacing or refactoring unrelated site areas

---

## 9. Quality bar

- TypeScript strict; no `any` in game core
- Accessible: keyboard alternative for drag (move piece via controls or focusable buttons)
- Do not break static export for the rest of the site; game auth routes fail gracefully on static-only deploy with a clear “login requires server mode” message
- One focused PR worth of work; minimal diffs outside game + auth + data wiring

Start by printing a brief plan (files to create/move, route name, DB schema) then implement.
