/**
 * Practice library — one SQL source for site /praticar and app pack.
 * Tables: lexico_* + context_decks (not consolidado/blocks, not APP lexico.json).
 */
import "server-only";

import { contentSource } from "@/lib/content/content-repository";
import type {
  PracticeLexicoCategory,
  PracticeLexicoEntry,
} from "@/lib/practice-library-types";
import type { ContextDeck, ContextDeckMeta } from "@/lib/context-decks";
import { prisma } from "@/server/db/prisma";
import {
  listContextDeckMeta,
  loadAllContextDecks,
} from "@/server/db/context-decks";

export type { PracticeLexicoCategory, PracticeLexicoEntry };

export type PracticeLibrary = {
  categories: PracticeLexicoCategory[];
  contextDecks: ContextDeck[];
  contextDeckMeta: ContextDeckMeta[];
};

/** Load the practice library from SQL (same tables as app snapshot). */
export async function loadPracticeLibrary(): Promise<PracticeLibrary> {
  if (contentSource() === "json") {
    return { categories: [], contextDecks: [], contextDeckMeta: [] };
  }

  const [cats, entries, contextDecks, contextDeckMeta] = await Promise.all([
    prisma.lexicoRotationCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.lexicoEntry.findMany({ orderBy: { sortOrder: "asc" } }),
    loadAllContextDecks(),
    listContextDeckMeta(),
  ]);

  const titleById = new Map(cats.map((c) => [c.id, c.title]));

  const byCat = new Map<string, PracticeLexicoEntry[]>();
  for (const e of entries) {
    const row: PracticeLexicoEntry = {
      id: e.id,
      hanzi: e.hanzi,
      pinyin: e.pinyin,
      translation: e.translation,
      hanziLength: e.hanziLength,
      rotationCategoryId: e.rotationCategoryId,
      rotationCategoryTitle:
        titleById.get(e.rotationCategoryId) ?? e.rotationCategoryId,
    };
    const list = byCat.get(e.rotationCategoryId) ?? [];
    list.push(row);
    byCat.set(e.rotationCategoryId, list);
  }

  const categories: PracticeLexicoCategory[] = cats.map((c) => ({
    id: c.id,
    title: c.title,
    sortOrder: c.sortOrder,
    entries: byCat.get(c.id) ?? [],
  }));

  return { categories, contextDecks, contextDeckMeta };
}
