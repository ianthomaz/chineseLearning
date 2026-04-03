"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { usePinyin } from "@/context/PinyinContext";
import { useTranslationDisplay } from "@/context/TranslationContext";
import type { VocabRow } from "@/lib/blocks";
import { extractHanziFromWord } from "@/lib/hanzi-chars";

const HanziStrokeModal = dynamic(
  () =>
    import("@/components/HanziStrokeModal").then((m) => ({
      default: m.HanziStrokeModal,
    })),
  { ssr: false },
);

type Props = {
  rows: VocabRow[];
};

type ModalState = {
  characters: string[];
  word: string;
  pinyin: string;
};

export function VocabTable({ rows }: Props) {
  const { showPinyin } = usePinyin();
  const { showTranslation } = useTranslationDisplay();
  const { t } = useLocale();
  const [strokeModal, setStrokeModal] = useState<ModalState | null>(null);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full min-w-[20rem] border-collapse text-left">
        <thead>
          <tr
            className="border-b"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "rgba(28,25,23,0.025)",
            }}
          >
            <th
              className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink/40"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {t("vocab.hanzi")}
            </th>
            {showPinyin ? (
              <th
                className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink/40"
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
              >
                {t("vocab.pinyin")}
              </th>
            ) : null}
            {showTranslation ? (
              <th
                className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink/40"
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
              >
                {t("vocab.translation")}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const hanziChars = extractHanziFromWord(row.hanzi);
            const canStroke = hanziChars.length > 0;
            return (
            <tr
              key={`${row.hanzi}-${row.pinyin}-${idx}`}
              className="border-b last:border-0 transition-colors hover:bg-ink/[0.03]"
              style={{
                borderColor: "var(--border)",
                backgroundColor:
                  idx % 2 === 1 ? "rgba(28,25,23,0.018)" : "transparent",
              }}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-hanzi text-xl font-medium text-ink">{row.hanzi}</span>
                  {canStroke ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-md border border-ink/15 px-2 py-1 text-xs font-medium text-ink/55 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 hover:text-ink"
                      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                      aria-label={t("vocab.openStrokesAria", { word: row.hanzi })}
                      onClick={() =>
                        setStrokeModal({
                          characters: hanziChars,
                          word: row.hanzi,
                          pinyin: row.pinyin,
                        })
                      }
                    >
                      {t("vocab.strokes")}
                    </button>
                  ) : null}
                </div>
              </td>
              {showPinyin ? (
                <td
                  className="px-4 py-3 text-sm italic"
                  style={{ color: "var(--accent-warm)" }}
                >
                  {row.pinyin}
                </td>
              ) : null}
              {showTranslation ? (
                <td className="px-4 py-3 text-sm text-ink/80">{row.translation}</td>
              ) : null}
            </tr>
            );
          })}
        </tbody>
      </table>
      <HanziStrokeModal
        open={strokeModal !== null}
        onClose={() => setStrokeModal(null)}
        characters={strokeModal?.characters ?? []}
        word={strokeModal?.word ?? ""}
        pinyin={strokeModal?.pinyin}
      />
    </div>
  );
}
