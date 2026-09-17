/**
 * Lyric-card reader. Public: the catalogue is course material, not player data,
 * and it is served as static JSON from `public/ktv/` in both build modes.
 */
import type { Metadata } from "next";
import { LyricsKtvSession } from "@/components/lyrics-ktv/LyricsKtvSession";

export const metadata: Metadata = { title: "Letras / KTV" };

export default function KtvPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <LyricsKtvSession />
    </div>
  );
}
