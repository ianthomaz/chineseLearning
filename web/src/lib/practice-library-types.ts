/** Shared practice-library types (safe for client + server). */

export type PracticeLexicoEntry = {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  hanziLength: number;
  rotationCategoryId: string;
  rotationCategoryTitle: string;
};

export type PracticeLexicoCategory = {
  id: string;
  title: string;
  /** Stable numeric id for HanziWritingGame blockId. */
  sortOrder: number;
  entries: PracticeLexicoEntry[];
};
