# Phrase Game — Upgrade Roadmap

Lean, prioritized backlog to improve the **Quebra-Cabeça de Frases** experience.
Reflects `main` after the 596-phrase bank + progressive-difficulty work
(`settings-by-level.ts`) and Google ID-token verification.

Each item lists **impact**, **effort**, and the **files** to touch. Ordered so the
top of each section is the best value-for-effort. Pick top-down.

---

## A. Quick wins (high impact, low effort)

1. **Audio playback (TTS).** Speak the sentence (and per-piece on tap) with the
   Web Speech API (`speechSynthesis`, `lang="zh-CN"`) — no backend, free.
   Add a 🔊 button in the result panel + optional auto-play on correct.
   _Impact: high (listening) · Effort: ~1h · `GameplayScreen.tsx`._

2. **Round-end review of misses.** `RoundComplete` only shows `X/10`. List the
   wrong phrases with hanzi + pinyin + gloss so the loop closes. Keep the user's
   attempt per item (extend `results` to `{ state, attempt }` or store the round).
   _Impact: high (retention) · Effort: ~2h · `PhraseGame.tsx`, new `RoundReview`._

3. **Tone-colored pinyin.** Color pinyin (and/or hanzi) by tone — standard
   pedagogy. `pinyin-pro` already exposes tone numbers; compute at build time in
   `build-phrase-game-data.mjs` (add `tone: 1..5` per character) and color in
   `PieceCard.tsx`. _Impact: high · Effort: ~1.5h · build script + `PieceCard`._

4. **Live a11y feedback.** Add `aria-live="polite"` to the correct/wrong panel so
   screen readers announce results. _Impact: med (a11y) · Effort: 15m._

---

## B. Medium (high impact, moderate effort)

5. **Persist progress (activate the SQLite stub).** The `progress` table in
   `server/db/index.ts` is created but never written. On submit, POST a row
   (`user_id, phrase_id, score, created_at`) via the existing
   `/api/game/progress` route; show "last round / best" on setup. Reuse
   `scoring.ts::computeScore`. _Impact: high · Effort: ~3h · `db/players.ts`(+progress), route, `AuthPanel`/setup._

6. **Score, streak & XP UI.** `scoring.ts` is computed-but-hidden. Surface
   per-phrase points (help level lowers score), a round score, and a current
   streak. Feeds motivation and the existing `/gamification` page.
   _Impact: high · Effort: ~2–3h · `GameplayScreen`, `RoundComplete`, `scoring.ts`._

7. **Mistake-driven repetition (SRS-lite).** Re-queue wrong phrases at the end of
   the round, and/or weight recently-missed phrases higher in `buildRound`.
   Biggest learning lever. _Impact: high · Effort: ~3h · `select-phrases.ts` + small client store._

---

## C. Phase 2 (larger)

8. **Leaderboard / ranking.** Auth + SQLite + nick already exist; scoring doc
   flags ranking as Phase 2. Add a `GET /api/game/leaderboard` (top nicks by
   summed score) + a simple panel. _Effort: ~4h._

9. **Intermediário / Avançado tiers.** Currently "Em breve". Needs HSK2+ content
   (curated bank + `tier` values) and unlocking the disabled tiers in
   `SetupScreen`. _Effort: content-bound._

10. **Gamification integration.** Hook round results into the existing
    `/gamification` page (daily goal, XP, badges). _Effort: ~3h._

---

## D. Data quality (now that the bank is 596 phrases)

11. **Stricter distractor validation.** `build-phrase-game-data.mjs` only *warns*
    on collisions. At this scale, add a hard check that a distractor cannot form
    an alternate valid sentence, and spot-check auto-filled pinyin/gloss on the
    bulk-added phrases. _Impact: high (avoids "two right answers") · Effort: ~2h · build script._

12. **`respostasAceitas` coverage.** Phrases with valid word-order variants (e.g.
    time-word placement) should list accepted alternates so correct answers
    aren't marked wrong. _Effort: content-bound; validator can flag candidates._

---

## E. Polish

13. **Mobile drag affordance.** The ◀▶ nudge buttons are small (`h-5 w-5`).
    Consider larger touch targets or tap-two-pieces-to-swap. `Board.tsx`.
14. **Respect `prefers-reduced-motion`** for dnd transitions. `Board.tsx`.
15. **Remove the prototype banner** (`phraseGame.prototypeNotice`) once stable.

---

### Suggested first sprint (≈1 day, max value)
**1 (audio)** + **2 (miss review)** + **3 (tone colors)** + **5 (persist progress)** —
together they turn a correct/incorrect drill into a feedback-rich learning loop,
all on infrastructure that already exists.
