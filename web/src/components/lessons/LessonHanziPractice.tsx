"use client";

import { useMemo } from "react";
import { HanziWritingGame } from "@/components/HanziWritingGame";
import type { ContentBlock, StructureGlossesByLocale } from "@/lib/blocks-types";

export type LessonPracticeWord = {
  hanzi: string;
  pinyin: string | null;
  translation: string | null;
};

const emptyLocalized = (): StructureGlossesByLocale => ({ pt: [], en: [], es: [] });

/**
 * Wraps the shared HanziWritingGame in lesson mode: builds one synthetic
 * ContentBlock from the lesson's words and practices every one of them.
 */
export function LessonHanziPractice({
  words,
  lessonTitle,
  lessonId,
}: {
  words: LessonPracticeWord[];
  lessonTitle: string;
  lessonId: number;
}) {
  const block = useMemo<ContentBlock>(
    () => ({
      id: lessonId,
      title: lessonTitle,
      narrative: "",
      structures: [],
      structureGlosses: emptyLocalized(),
      reviewStandalonePhrases: emptyLocalized(),
      reviewMiniDialogues: [],
      notes: [],
      differences: [],
      priorities: [],
      vocabulary: words.map((w) => ({
        hanzi: w.hanzi,
        pinyin: w.pinyin ?? "",
        translation: w.translation ?? "",
      })),
    }),
    [words, lessonTitle, lessonId],
  );

  return <HanziWritingGame blocks={[block]} embeddedInPage useAllWords />;
}
