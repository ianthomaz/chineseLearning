/**
 * Site/server LLM hook for lexico category assignment (partial).
 *
 * Design:
 * - Widgets / avulso consume only lexico_entries (categorized pool).
 * - New words from context decks / lexicon_global stay pending until classified.
 * - Run classification via site LLM (LLM_API_URL), persist into
 *   scripts/lexico-category-assignments.mjs, then LEXICO_REBUILD=1.
 *
 * Ready to call the LLM; auto-write of assignments is intentionally not wired.
 */

import type { LexicoPendingCandidate } from "./pending";

const LLM_API_URL = process.env.LLM_API_URL || "http://127.0.0.1:28471";
const LLM_API_TOKEN = process.env.LLM_API_TOKEN;

/** Keep in sync with web/scripts/lexico-rotation-config.mjs */
const ROTATION_CATEGORIES = [
  { id: "basics", title: "Básicos: números, tempo e perguntas" },
  { id: "people", title: "Pessoas, família e pronomes" },
  { id: "places_world", title: "Lugares, países e movimento" },
  { id: "food", title: "Frutas e bebidas" },
  { id: "descriptions", title: "Cores e qualidades" },
  { id: "verbs", title: "Verbos, gostos e preferências" },
  { id: "grammar_bits", title: "Partículas e revisão essencial" },
] as const;

export type LexicoCategoryId = (typeof ROTATION_CATEGORIES)[number]["id"];

export type LexicoClassification = {
  hanzi: string;
  rotationCategoryId: LexicoCategoryId;
  confidence?: number;
  rationale?: string;
};

const CATEGORY_IDS = new Set<string>(ROTATION_CATEGORIES.map((c) => c.id));

function categoryCatalogForPrompt(): string {
  return ROTATION_CATEGORIES.map((c) => `- ${c.id}: ${c.title}`).join("\n");
}

export function buildClassifyPrompt(
  candidates: LexicoPendingCandidate[],
): string {
  const lines = candidates
    .map(
      (c) =>
        `- hanzi=${c.hanzi} | pinyin=${c.pinyin} | meaning=${c.translation} | from=${c.from}`,
    )
    .join("\n");
  return [
    "Classify each Chinese word into exactly one rotation category for a flashcard/widget lexicon.",
    "Categories:",
    categoryCatalogForPrompt(),
    "Rules: pick the single best fit; prefer verbs for actions; grammar_bits for particles/connectors/classifiers; people for roles/groups; places_world for places/objects; descriptions for adjectives/qualities/nouns of quality; basics for time/study-schedule bits.",
    "Reply with JSON only: an array of {\"hanzi\":\"…\",\"rotationCategoryId\":\"…\",\"confidence\":0-1,\"rationale\":\"…\"}.",
    "Words:",
    lines,
  ].join("\n");
}

/**
 * Call featureLLM edu/chat (same stack as /api/chat). Returns parsed rows or throws.
 * Caller persists assignments intentionally (no auto-write).
 */
export async function classifyLexicoPendingWithLlm(
  candidates: LexicoPendingCandidate[],
): Promise<LexicoClassification[]> {
  if (candidates.length === 0) return [];

  const message = buildClassifyPrompt(candidates);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (LLM_API_TOKEN) headers.Authorization = `Bearer ${LLM_API_TOKEN}`;

  const response = await fetch(`${LLM_API_URL}/edu/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      history: [],
      level: "HSK1",
      language: "zh-CN",
      model: process.env.LLM_LEXICO_CLASSIFY_MODEL?.trim() || "smart",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `LLM classify failed HTTP ${response.status}: ${text.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as {
    reply?: string;
    content?: string;
    structured?: unknown;
  };

  const raw =
    payload.structured ??
    tryParseJsonArray(payload.reply ?? payload.content ?? "");

  if (!Array.isArray(raw)) {
    throw new Error("LLM classify: expected JSON array in response");
  }

  const out: LexicoClassification[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const hanzi = String(row.hanzi ?? "").trim();
    const rotationCategoryId = String(row.rotationCategoryId ?? "").trim();
    if (!hanzi || !CATEGORY_IDS.has(rotationCategoryId)) continue;
    out.push({
      hanzi,
      rotationCategoryId: rotationCategoryId as LexicoCategoryId,
      confidence:
        typeof row.confidence === "number" ? row.confidence : undefined,
      rationale:
        typeof row.rationale === "string" ? row.rationale : undefined,
    });
  }
  return out;
}

function tryParseJsonArray(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}
