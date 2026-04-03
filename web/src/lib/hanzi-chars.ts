/** CJK Unified Ideographs + extension A + compatibility — enough for course vocabulary. */
const HANZI_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/u;

export function extractHanziFromWord(word: string): string[] {
  return Array.from(word).filter((ch) => HANZI_RE.test(ch));
}
