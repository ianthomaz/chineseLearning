/**
 * Maps block 15 "Prioridades" lines (by index) to block ids in the course.
 * Keep in sync with Content/consolidado_final.md §15 Prioridades order.
 */
export const BLOCK_15_PRIORITY_TARGET_IDS: number[][] = [
  [1],
  [2],
  [3],
  [4, 5, 6],
  [8],
  [9],
  [10],
  [11],
  [12],
  [13],
  [14],
];

export function targetsForBlock15PriorityLine(
  lineIndex: number,
): number[] | undefined {
  return BLOCK_15_PRIORITY_TARGET_IDS[lineIndex];
}
