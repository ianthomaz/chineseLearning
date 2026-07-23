/**
 * Shared types for the app library snapshot (APP_hanziMemorize contract).
 * See docs/14_app_library_contract.md
 */

export const APP_LIBRARY_SCHEMA_VERSION = 1;

export type AppLibraryRotationCategory = {
  id: string;
  title: string;
};

export type AppLibraryEntry = {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  hanziLength: number;
  rotationCategoryId: string;
  rotationCategoryTitle: string;
};

export type AppLibraryContextCard = {
  word: string;
  pinyin: string;
  meaning: string;
  section?: string;
  pattern?: string;
  patternLabel?: string;
  sentence?: string;
  sentencePinyin?: string;
  sentenceMeaning?: string;
  related?: string;
  patterns?: string;
  notes?: string;
};

export type AppLibraryContextDeck = {
  id: string;
  title: string;
  description?: string;
  cards: AppLibraryContextCard[];
};

export type AppLibraryPack = {
  meta: {
    schemaVersion: number;
    contentVersion: number;
    /** Same as contentVersion — alias for LexiconSeed / older readers. */
    version: number;
    source: "chineseLearning";
    generatedAt: string;
  };
  rotationCategories: AppLibraryRotationCategory[];
  entries: AppLibraryEntry[];
  contextDecks: AppLibraryContextDeck[];
};

export type AppLibraryManifest = {
  schemaVersion: number;
  contentVersion: number;
  generatedAt: string;
  library: {
    byteSize: number;
    sha256: string;
    url: string;
  };
};

export type AppLibraryMetaFile = {
  schemaVersion: number;
  contentVersion: number;
  generatedAt: string;
  byteSize: number;
  sha256: string;
  /** Public pack path including basePath (e.g. /aulaChines/api/...). */
  packUrl: string;
  /** Hash of payload sections only (no meta) — used to decide version bumps. */
  contentFingerprint: string;
};
