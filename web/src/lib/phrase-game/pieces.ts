/**
 * Derivation of draggable pieces from a phrase, per game level + settings.
 *
 * Pure functions. Randomness (shuffle, which words to split) is applied once per
 * phrase by the caller and stored in state — never re-derived on every render.
 */

import type { GameLevel, Phrase, Piece, Token } from "./types";

let pieceSeq = 0;
/** Monotonic id so @dnd-kit always has stable, unique keys across a session. */
function nextPieceId(prefix: string): string {
  pieceSeq += 1;
  return `${prefix}-${pieceSeq}`;
}

function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Whether a level splits multi-char words into individual hanzi. */
function splitMode(level: GameLevel): "none" | "partial" | "full" {
  if (level === 5) return "full";
  if (level === 4) return "partial";
  return "none";
}

/** Indices of tokens to split when in partial (level 4) mode: one or two multi-char words. */
function pickPartialSplitTargets(tokens: Token[]): Set<number> {
  const multi = tokens
    .map((tok, idx) => ({ idx, multi: tok.caracteres.length > 1 }))
    .filter((t) => t.multi)
    .map((t) => t.idx);
  if (multi.length === 0) return new Set();
  const howMany = Math.min(multi.length, multi.length === 1 ? 1 : 2);
  return new Set(shuffle(multi).slice(0, howMany));
}

function wholeWordPiece(token: Token, correctIndex: number): Piece {
  return {
    id: nextPieceId("p"),
    hanzi: token.palavra,
    pinyin: token.pinyin,
    pt: token.pt,
    dificil: token.dificil,
    isDistractor: false,
    correctIndex,
  };
}

function charPieces(token: Token, startIndex: number): Piece[] {
  return token.caracteres.map((c, i) => ({
    id: nextPieceId("p"),
    hanzi: c.hanzi,
    pinyin: c.pinyin,
    // A split character carries the word gloss on its first character only.
    pt: i === 0 ? token.pt : "",
    dificil: token.dificil,
    isDistractor: false,
    correctIndex: startIndex + i,
  }));
}

/**
 * Build the ordered list of *correct* pieces for a phrase at a given level.
 * `correctIndex` is the slot position the piece must occupy in the answer strip.
 */
export function deriveCorrectPieces(phrase: Phrase, level: GameLevel): Piece[] {
  const mode = splitMode(level);
  const splitTargets =
    mode === "partial" ? pickPartialSplitTargets(phrase.tokens) : null;

  const pieces: Piece[] = [];
  let slot = 0;
  phrase.tokens.forEach((token, idx) => {
    const doSplit =
      mode === "full" || (mode === "partial" && splitTargets?.has(idx));
    if (doSplit && token.caracteres.length > 1) {
      const cps = charPieces(token, slot);
      pieces.push(...cps);
      slot += cps.length;
    } else {
      pieces.push(wholeWordPiece(token, slot));
      slot += 1;
    }
  });
  return pieces;
}

/** Build distractor pieces (already clamped to ≤2 by the round planner). */
export function deriveDistractorPieces(
  phrase: Phrase,
  distractorCount: number,
): Piece[] {
  const n = Math.max(0, Math.min(distractorCount, phrase.distratores.length, 2));
  return phrase.distratores.slice(0, n).map((d) => ({
    id: nextPieceId("d"),
    hanzi: d.hanzi,
    pinyin: d.pinyin,
    pt: d.pt,
    dificil: false,
    isDistractor: true,
    correctIndex: null,
  }));
}

export type DerivedBoard = {
  /** Pieces shown in the shuffled bank at the start of the phrase. */
  bank: Piece[];
  /** Correct pieces in answer order (used by the "next piece" help). */
  correctOrder: Piece[];
};

/**
 * Derive the full board (bank pieces, shuffled) for a phrase. Call once per phrase.
 */
export function deriveBoard(
  phrase: Phrase,
  level: GameLevel,
  distractorCount: number,
): DerivedBoard {
  const correct = deriveCorrectPieces(phrase, level);
  const distractors = deriveDistractorPieces(phrase, distractorCount);
  return {
    bank: shuffle([...correct, ...distractors]),
    correctOrder: correct,
  };
}
