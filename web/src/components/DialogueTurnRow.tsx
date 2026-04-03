"use client";

import { ChineseWithPinyinLine } from "@/components/ChineseWithPinyinLine";
import { PhraseRevealLine } from "@/components/PhraseRevealLine";
import { useLocale } from "@/context/LocaleContext";
import { useTranslationDisplay } from "@/context/TranslationContext";
import type { DialogueTurn } from "@/lib/blocks";
import { pickLocalized } from "@/lib/localized-line";

type Props = {
  turn: DialogueTurn;
  variant: "left" | "right" | "center";
  /** Per-line eye toggle (review mini-dialogues); when false, use global read settings. */
  phraseReveal?: boolean;
};

export function DialogueTurnRow({ turn, variant, phraseReveal }: Props) {
  const { showTranslation } = useTranslationDisplay();
  const { locale } = useLocale();
  const align =
    variant === "right"
      ? "items-end text-right"
      : variant === "center"
        ? "items-center text-center"
        : "items-start text-left";
  const border =
    variant === "right"
      ? "border-r-4 pr-3"
      : variant === "center"
        ? "border-l-4 pl-3"
        : "border-l-4 pl-3";
  const color =
    variant === "right"
      ? "rgba(45, 90, 140, 0.85)"
      : variant === "center"
        ? "rgba(61, 107, 74, 0.85)"
        : "rgba(140, 74, 45, 0.85)";

  return (
    <div className={`flex flex-col gap-1 ${align}`}>
      <span
        className={`max-w-[min(100%,28rem)] rounded-lg border py-2 ${border}`}
        style={{ borderColor: color }}
      >
        <span
          className="mb-1 block px-3 text-[10px] font-semibold uppercase tracking-wider text-ink/40"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {turn.speaker}
        </span>
        <div className="px-3">
          {phraseReveal ? (
            <PhraseRevealLine
              hanzi={turn.hanzi}
              pinyin={turn.pinyin}
              translation={pickLocalized(turn.translation, locale)}
              hanziClassName="font-hanzi text-lg leading-relaxed text-ink md:text-xl"
              glossClassName="mt-1 text-xs leading-snug text-ink/50"
            />
          ) : (
            <>
              <ChineseWithPinyinLine
                hanzi={turn.hanzi}
                pinyin={turn.pinyin}
                hanziClassName="font-hanzi text-lg leading-relaxed text-ink md:text-xl"
              />
              {showTranslation ? (
                <p
                  className="mt-1 text-xs leading-snug text-ink/50"
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                >
                  {pickLocalized(turn.translation, locale)}
                </p>
              ) : null}
            </>
          )}
        </div>
      </span>
    </div>
  );
}

function variantForSpeaker(speaker: string, index: number): "left" | "right" | "center" {
  const u = speaker.trim().toUpperCase();
  if (u === "B") return "right";
  if (u === "C") return "center";
  if (u === "A") return "left";
  return index % 2 === 0 ? "left" : "right";
}

type ConvProps = {
  turns: DialogueTurn[];
  phraseReveal?: boolean;
};

export function DialogueConversation({ turns, phraseReveal }: ConvProps) {
  return (
    <div className="flex flex-col gap-3">
      {turns.map((turn, i) => (
        <DialogueTurnRow
          key={`${turn.speaker}-${i}-${turn.hanzi.slice(0, 8)}`}
          turn={turn}
          variant={variantForSpeaker(turn.speaker, i)}
          phraseReveal={phraseReveal}
        />
      ))}
    </div>
  );
}
