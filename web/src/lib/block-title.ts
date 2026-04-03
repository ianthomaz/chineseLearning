/** Localized block title from messages, or `fallbackTitle` from the course source. */
export function localizedBlockTitle(
  blockId: number,
  fallbackTitle: string,
  t: (path: string, vars?: Record<string, string | number>) => string,
): string {
  const key = `blockTitles.${blockId}`;
  const v = t(key);
  return v === key ? fallbackTitle : v;
}
