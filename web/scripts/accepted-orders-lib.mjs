/**
 * Shared rules for `respostasAceitas` — alternative word orders the phrase game
 * accepts besides the canonical answer.
 *
 * Used by three places, on purpose: the proposal script (to drop bad LLM
 * output), the apply script (defence in depth before writing the bank) and the
 * build validator (the last gate before anything reaches a player).
 *
 * The only thing an accepted answer may be is a REORDERING of the very pieces
 * the player is given. It may not introduce, drop, split or alter a character —
 * the board could not produce such an answer anyway.
 */

/** Characters the game treats as Chinese text; anything else is rejected. */
const HAN = /^[㐀-䶿一-鿿豈-﫿]+$/;

export function isHanziOnly(text) {
  return typeof text === "string" && text.length > 0 && HAN.test(text);
}

function charCounts(text) {
  const counts = new Map();
  for (const ch of text) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  return counts;
}

function sameCharMultiset(a, b) {
  const ca = charCounts(a);
  const cb = charCounts(b);
  if (ca.size !== cb.size) return false;
  for (const [ch, n] of ca) if (cb.get(ch) !== n) return false;
  return true;
}

/**
 * Can `text` be split into exactly the given pieces, each used once?
 *
 * Backtracking over the piece multiset. Phrases top out at 9 pieces, so the
 * search space is irrelevant in practice, and the character pre-check rejects
 * almost everything before we get here.
 */
export function segmentsIntoPieces(text, pieces) {
  if (!sameCharMultiset(text, pieces.join(""))) return false;

  const used = new Array(pieces.length).fill(false);

  const walk = (pos) => {
    if (pos === text.length) return used.every(Boolean);
    const tried = new Set();
    for (let i = 0; i < pieces.length; i += 1) {
      if (used[i] || tried.has(pieces[i])) continue;
      if (!text.startsWith(pieces[i], pos)) continue;
      tried.add(pieces[i]); // identical pieces are interchangeable
      used[i] = true;
      if (walk(pos + pieces[i].length)) return true;
      used[i] = false;
    }
    return false;
  };

  return walk(0);
}

/**
 * Check one candidate against a phrase.
 * Returns `{ ok: true }` or `{ ok: false, reason }` — the reason is shown to a
 * human, so keep it concrete.
 */
export function checkAcceptedOrder(candidate, { hanzi, pieces, existing = [] }) {
  if (!isHanziOnly(candidate)) {
    return { ok: false, reason: "not hanzi-only" };
  }
  if (candidate === hanzi) {
    return { ok: false, reason: "same as the canonical answer" };
  }
  if (existing.includes(candidate)) {
    return { ok: false, reason: "already accepted" };
  }
  if (!segmentsIntoPieces(candidate, pieces)) {
    return { ok: false, reason: "not a reordering of the phrase's pieces" };
  }
  return { ok: true };
}

/**
 * Validate a whole phrase's accepted answers. Returns the list of problems,
 * empty when everything is fine.
 */
export function validatePhraseAcceptedOrders({ id, hanzi, pieces, accepted }) {
  const problems = [];
  const seen = [];
  for (const candidate of accepted ?? []) {
    const verdict = checkAcceptedOrder(candidate, { hanzi, pieces, existing: seen });
    if (verdict.ok) seen.push(candidate);
    else problems.push(`${id}: respostasAceitas "${candidate}" — ${verdict.reason}`);
  }
  return problems;
}
