import type { AppLocale } from "@/lib/i18n-core";
import type { QuestionTypeSpec, QuizQuestion } from "./types";

const QUESTION_KEY: Record<AppLocale, keyof QuizQuestion> = {
  pt: "question_pt",
  en: "question_en",
  es: "question_es",
};

const EXPLAIN_KEY: Record<AppLocale, keyof QuizQuestion> = {
  pt: "explanation_pt",
  en: "explanation_en",
  es: "explanation_es",
};

const OPTIONS_KEY: Record<AppLocale, keyof QuizQuestion> = {
  pt: "options_pt",
  en: "options_en",
  es: "options_es",
};

export function localizedQuestionPrompt(q: QuizQuestion, locale: AppLocale): string {
  const v = q[QUESTION_KEY[locale]];
  return typeof v === "string" ? v : "";
}

export function localizedExplanation(q: QuizQuestion, locale: AppLocale): string {
  const v = q[EXPLAIN_KEY[locale]];
  return typeof v === "string" ? v : "";
}

export function localizedOptions(q: QuizQuestion, locale: AppLocale): string[] {
  const v = q[OPTIONS_KEY[locale]];
  return Array.isArray(v) ? (v as string[]) : [];
}

export function questionTypeDisplayName(
  spec: QuestionTypeSpec,
  locale: AppLocale,
): string {
  if (locale === "en") return spec.name_en;
  if (locale === "es") return spec.name_es;
  return spec.name;
}

export function localizedCorrectAnswer(q: QuizQuestion, locale: AppLocale): string {
  const key = `correct_answer_${locale}` as keyof QuizQuestion;
  const v = q[key];
  return typeof v === "string" ? v : "";
}

export function localizedCorrectOrder(q: QuizQuestion, locale: AppLocale): string[] {
  const key = `correct_order_${locale}` as keyof QuizQuestion;
  const v = q[key];
  return Array.isArray(v) ? (v as string[]) : [];
}

export function localizedWords(q: QuizQuestion, locale: AppLocale): string[] {
  const key = `words_${locale}` as keyof QuizQuestion;
  const v = q[key];
  return Array.isArray(v) ? (v as string[]) : [];
}
