import "server-only";

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { contentSource } from "@/lib/content/content-repository";
import { prisma } from "@/server/db/prisma";
import type { ContextDeck, ContextDeckCard, ContextDeckMeta } from "@/lib/context-decks";

function mapCard(row: {
  word: string;
  pinyin: string;
  meaning: string;
  section: string | null;
  pattern: string | null;
  patternLabel: string | null;
  sentence: string | null;
  sentencePinyin: string | null;
  sentenceMeaning: string | null;
  related: string | null;
  patterns: string | null;
  notes: string | null;
}): ContextDeckCard {
  const card: ContextDeckCard = {
    word: row.word,
    pinyin: row.pinyin,
    meaning: row.meaning,
  };
  if (row.section) card.section = row.section;
  if (row.pattern) card.pattern = row.pattern;
  if (row.patternLabel) card.patternLabel = row.patternLabel;
  if (row.sentence) card.sentence = row.sentence;
  if (row.sentencePinyin) card.sentencePinyin = row.sentencePinyin;
  if (row.sentenceMeaning) card.sentenceMeaning = row.sentenceMeaning;
  if (row.related) card.related = row.related;
  if (row.patterns) card.patterns = row.patterns;
  if (row.notes) card.notes = row.notes;
  return card;
}

/** Bootstrap archive — only for CONTENT_SOURCE=json (static export). */
function loadFromBootstrapJson(): { decks: ContextDeck[]; meta: ContextDeckMeta[] } {
  const dir = join(process.cwd(), "src/data/context-decks");
  const indexPath = join(dir, "index.json");
  if (!existsSync(indexPath)) return { decks: [], meta: [] };
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
    decks: ContextDeckMeta[];
  };
  const meta = index.decks ?? [];
  const decks: ContextDeck[] = [];
  for (const m of meta) {
    const p = join(dir, `${m.id}.json`);
    if (!existsSync(p)) continue;
    const raw = JSON.parse(readFileSync(p, "utf8")) as ContextDeck;
    decks.push({ id: m.id, title: raw.title ?? m.title, cards: raw.cards ?? [] });
  }
  return { decks, meta };
}

/** All context decks with cards — SQL is source of truth. */
export async function loadAllContextDecks(): Promise<ContextDeck[]> {
  if (contentSource() === "json") {
    return loadFromBootstrapJson().decks;
  }

  const rows = await prisma.contextDeck.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      cards: { orderBy: { sortOrder: "asc" } },
    },
  });

  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    cards: d.cards.map(mapCard),
  }));
}

export async function listContextDeckMeta(): Promise<ContextDeckMeta[]> {
  if (contentSource() === "json") {
    return loadFromBootstrapJson().meta;
  }

  const rows = await prisma.contextDeck.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { cards: true } } },
  });
  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    cardCount: d._count.cards,
  }));
}
