/**
 * Single rotation map for the practice library (site + app pack).
 * Used when materializing lexico_* from vocab_entries.
 */
export const MAX_HANZI_LENGTH = 3;

export const EXCLUDED_SOURCE_BLOCK_IDS = new Set([16]);

export const ROTATION_CATEGORIES = [
  {
    id: "basics",
    title: "Básicos: números, tempo e perguntas",
    sourceBlockIds: [1, 2, 8],
  },
  {
    id: "people",
    title: "Pessoas, família e pronomes",
    sourceBlockIds: [7, 9],
  },
  {
    id: "places_world",
    title: "Lugares, países e movimento",
    sourceBlockIds: [4, 5, 14],
  },
  {
    id: "food",
    title: "Comida, cozinha e bebidas",
    sourceBlockIds: [3],
  },
  {
    id: "descriptions",
    title: "Cores e qualidades",
    sourceBlockIds: [6],
  },
  {
    id: "verbs",
    title: "Verbos, gostos e preferências",
    sourceBlockIds: [11, 12, 13],
  },
  {
    id: "grammar_bits",
    title: "Partículas e revisão essencial",
    sourceBlockIds: [10, 15],
  },
  // NTCSL level-2 thematic pools (assignments only; no editorial blocks)
  {
    id: "weather",
    title: "Tempo e estações",
    sourceBlockIds: [],
  },
  {
    id: "health",
    title: "Saúde e corpo",
    sourceBlockIds: [],
  },
  {
    id: "study",
    title: "Estudo e escola",
    sourceBlockIds: [],
  },
];
