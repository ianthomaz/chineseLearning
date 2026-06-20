/**
 * Core types for the "Quebra-Cabeça de Frases" phrase-builder game.
 *
 * These mirror the canonical dataset schema in `FRASES_GAME/schema.json` and the
 * validated artifact emitted to `web/src/data/phrase-game/phrases.json`.
 * Keep this file free of `any` — it is the typed contract for the whole game.
 */

/** A single hanzi character with its pinyin (pinyin may be empty in source data). */
export type Character = {
  hanzi: string;
  pinyin: string;
};

/** An ordered word piece of the canonical sentence. */
export type Token = {
  /** Hanzi word, may be multi-character (e.g. "我们"). */
  palavra: string;
  caracteres: Character[];
  pinyin: string;
  /** Portuguese gloss (may be empty for proper nouns / numbers). */
  pt: string;
  /** HSK2 / hard word — eligible for "difficult word" hints. */
  dificil: boolean;
};

/** A distractor candidate — never part of the correct answer. */
export type Distractor = {
  hanzi: string;
  pinyin: string;
  pt: string;
};

/** Vocabulary tier a phrase belongs to. */
export type Tier = "hsk1" | "basico";

/** A canonical phrase from the validated bank. */
export type Phrase = {
  id: string;
  /** Authoring hint (1..5). Pool selection uses token count + tier, not only this. */
  nivel: number;
  tier: Tier;
  /** Prompt shown to the user — Portuguese is required, en/es optional (fallback → pt). */
  pt: string;
  en?: string;
  es?: string;
  /** Canonical answer string, no spaces. */
  hanzi: string;
  pinyin: string;
  tokens: Token[];
  /** 0..2 distractor candidates at most (dataset enforces the cap at build time). */
  distratores: Distractor[];
  /** Optional alternate valid hanzi strings. */
  respostasAceitas?: string[];
  tags?: string[];
};

/** Playable language tiers on the setup screen. */
export type GameTier = "iniciante" | "basico" | "intermediario" | "avancado";

/** Game difficulty level (1..5). */
export type GameLevel = 1 | 2 | 3 | 4 | 5;

/** Display / hint toggles, adjustable on setup and mid-phrase. */
export type DisplaySettings = {
  /** Show the sentence prompt in the user's locale (default). */
  showNativePrompt: boolean;
  /** Pieces show hanzi only (default). */
  hanziOnly: boolean;
  /** Add up to 2 extra hanzi distractors (respects global max of 2). */
  addExtraHanzi: boolean;
  /** Show pinyin on difficult (HSK2 / `dificil`) pieces only. */
  pinyinDifficult: boolean;
  /** Show pinyin on all pieces. */
  hanziPlusPinyin: boolean;
  /** Show PT gloss on difficult pieces only. */
  translationDifficult: boolean;
};

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showNativePrompt: true,
  hanziOnly: true,
  addExtraHanzi: false,
  pinyinDifficult: false,
  hanziPlusPinyin: false,
  translationDifficult: false,
};

/** A draggable piece on the board. */
export type Piece = {
  /** Stable unique id used by @dnd-kit. */
  id: string;
  hanzi: string;
  pinyin: string;
  /** PT gloss for translation hints (may be empty). */
  pt: string;
  dificil: boolean;
  isDistractor: boolean;
  /** Position in the correct answer order; null for distractors. */
  correctIndex: number | null;
};

/** Number of phrases per round. */
export const ROUND_SIZE = 10;

/** One phrase planned into a round, with its decided distractor budget. */
export type RoundItem = {
  phrase: Phrase;
  /** Distractor pieces this phrase will receive (already clamped to ≤2). */
  distractorCount: number;
};

export type RoundConfig = {
  tier: GameTier;
  level: GameLevel;
  settings: DisplaySettings;
};

/** Result of submitting an answer. */
export type SubmitResult = {
  correct: boolean;
  /** Hanzi string the user assembled (answer strip, in order). */
  attempt: string;
};
