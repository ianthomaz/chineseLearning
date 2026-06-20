/** Shared randomness helpers for the phrase game. */

/**
 * Uniform Fisher-Yates shuffle. Returns a new array; the input is untouched.
 *
 * Use this instead of `array.sort(() => Math.random() - 0.5)`, whose comparator
 * is non-uniform (and implementation-defined) — it biases which items are
 * picked and where they land.
 */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
