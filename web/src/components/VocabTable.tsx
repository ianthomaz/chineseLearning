"use client";

import { useLocale } from "@/context/LocaleContext";
import { usePinyin } from "@/context/PinyinContext";
import { useTranslationDisplay } from "@/context/TranslationContext";
import type { VocabRow } from "@/lib/blocks";

type Props = {
  rows: VocabRow[];
};

export function VocabTable({ rows }: Props) {
  const { showPinyin } = usePinyin();
  const { showTranslation } = useTranslationDisplay();
  const { t } = useLocale();

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
          {rows.map((row, idx) => (
            <tr
              key={`${row.hanzi}-${row.pinyin}-${idx}`}
              className="border-b last:border-0 transition-colors hover:bg-ink/[0.03]"
              style={{
                borderColor: "var(--border)",
                backgroundColor:
                  idx % 2 === 1 ? "rgba(28,25,23,0.018)" : "transparent",
              }}
            >
              <td className="px-4 py-3 font-hanzi text-xl font-medium text-ink">
                {row.hanzi}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
