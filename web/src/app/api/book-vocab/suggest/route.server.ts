import { NextResponse } from "next/server";
import { requireCurator } from "@/server/auth/session";
import { suggestBookVocab } from "@/server/db/books";

export const dynamic = "force-dynamic";

/** Curator helper: suggest pinyin/gloss from book chapter lexicon (Eixo A). */
export async function GET(req: Request) {
  try {
    await requireCurator();
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  const url = new URL(req.url);
  const hanzi = (url.searchParams.get("hanzi") ?? "").trim();
  if (!hanzi) {
    return NextResponse.json({ error: "hanzi required" }, { status: 400 });
  }

  const hit = suggestBookVocab(hanzi);
  if (!hit) return NextResponse.json({ suggestion: null });

  return NextResponse.json({
    suggestion: {
      hanzi: hit.hanzi,
      pinyin: hit.pinyin,
      translation: hit.glossEn,
      pos: hit.pos,
      bookId: hit.bookId,
      lesson: hit.lesson,
      source: hit.source,
    },
  });
}
