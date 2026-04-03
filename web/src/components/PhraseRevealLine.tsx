"use client";

import { useState } from "react";
import { ChineseWithPinyinLine } from "@/components/ChineseWithPinyinLine";
import { useLocale } from "@/context/LocaleContext";

type Phase = 0 | 1 | 2;

function nextRevealPhase(
  phase: Phase,
  hasPinyin: boolean,
  hasTranslation: boolean,
): Phase {
  if (hasPinyin && hasTranslation) {
    if (phase === 0) return 1;
    if (phase === 1) return 2;
    return 0;
  }
  if (hasPinyin && !hasTranslation) return phase === 0 ? 1 : 0;
  if (!hasPinyin && hasTranslation) return phase === 0 ? 2 : 0;
  return 0;
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

type Props = {
  hanzi: string;
  pinyin: string;
  translation: string;
  hanziClassName?: string;
  glossClassName?: string;
  containerClassName?: string;
};

export function PhraseRevealLine({
  hanzi,
  pinyin,
  translation,
  hanziClassName,
  glossClassName = "mt-2 text-sm leading-snug text-ink/50",
  containerClassName = "",
}: Props) {
  const { t } = useLocale();
  const [phase, setPhase] = useState<Phase>(0);

  const hasPinyin = pinyin.trim().length > 0;
  const hasTranslation = translation.trim().length > 0;
  const showRevealControl = hasPinyin || hasTranslation;

  /** Phase 1: hanzi + pinyin; phase 2: same ruby + translation below. */
  const showRuby = hasPinyin && (phase === 1 || phase === 2);
  const showGloss = hasTranslation && phase === 2;

  const body = (
    <>
      <ChineseWithPinyinLine
        hanzi={hanzi}
        pinyin={pinyin}
        hanziClassName={hanziClassName}
        showPinyinOverride={showRuby}
      />
      {showGloss ? (
        <p
          className={glossClassName}
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {translation}
        </p>
      ) : null}
    </>
  );

  if (!showRevealControl) {
    return (
      <div className={containerClassName}>
        <ChineseWithPinyinLine
          hanzi={hanzi}
          pinyin={pinyin}
          hanziClassName={hanziClassName}
          showPinyinOverride={false}
        />
      </div>
    );
  }

  return (
    <div className={`flex gap-2 items-start ${containerClassName}`.trim()}>
      <button
        type="button"
        className="mt-0.5 shrink-0 rounded-md p-1 text-ink/35 transition-colors hover:bg-ink/[0.06] hover:text-ink/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label={t("review.revealPhraseAria")}
        onClick={() =>
          setPhase((p) => nextRevealPhase(p, hasPinyin, hasTranslation))
        }
      >
        <EyeIcon />
      </button>
      <div className="min-w-0 flex-1">{body}</div>
    </div>
  );
}
