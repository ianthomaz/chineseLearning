import type { AppLocale } from "@/lib/i18n-core";

export type QuizQuestionTypeId =
  | "multiple_choice"
  | "fill_blank"
  | "translation"
  | "listening"
  | "ordering";

export type QuestionTypeSpec = {
  name: string;
  name_en: string;
  name_es: string;
  layout: string;
  audio_placeholder?: string;
};

export type QuizBankLanguage = {
  source: "pt";
  targets: Exclude<AppLocale, "pt">[];
  hanzi_field: string;
  pinyin_field: string;
};

export type QuizBankMetadata = {
  total_questions: number;
  /** Roadmap size; may exceed len(questions) while the bank grows */
  target_question_count?: number;
  hsk_level: number;
  blocks_covered: number[];
};

/** One row from `hsk1-quiz-bank.json`; fields vary by `type`. */
export type QuizQuestion = {
  id: number;
  type: QuizQuestionTypeId;
  difficulty: number;
  block: number;
  topic: string;
  hanzi: string;
  pinyin: string;
  question_pt: string;
  question_en: string;
  question_es: string;
  explanation_pt: string;
  explanation_en: string;
  explanation_es: string;
  correct?: number;
  options_pt?: string[];
  options_en?: string[];
  options_es?: string[];
  correct_answer_pt?: string;
  correct_answer_en?: string;
  correct_answer_es?: string;
  words_pt?: string[];
  words_en?: string[];
  words_es?: string[];
  correct_order_pt?: string[];
  correct_order_en?: string[];
  correct_order_es?: string[];
};

export type QuizBank = {
  version: string;
  language: QuizBankLanguage;
  metadata: QuizBankMetadata;
  question_types: Record<string, QuestionTypeSpec>;
  questions: QuizQuestion[];
};
