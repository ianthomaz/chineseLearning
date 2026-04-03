"use client";

import Link from "next/link";
import { blocks } from "@/lib/blocks";
import { localizedBlockTitle } from "@/lib/block-title";
import { useLocale } from "@/context/LocaleContext";

type Props = {
  blockId: number;
  mode: "review" | "vocabulary" | "grammar";
};

const path = {
  review: "/review",
  vocabulary: "/vocabulary",
  grammar: "/grammar",
} as const;

export function BlockPager({ blockId, mode }: Props) {
  const { t } = useLocale();
  const base = path[mode];
  const idx = blocks.findIndex((b) => b.id === blockId);
  const prev = idx > 0 ? blocks[idx - 1] : null;
  const next = idx >= 0 && idx < blocks.length - 1 ? blocks[idx + 1] : null;

  return (
    <nav
      className="mt-14 flex gap-3 border-t pt-8"
      style={{ borderColor: "var(--border)" }}
      aria-label={t("pager.aria")}
    >
      {prev ? (
        <Link
          href={`${base}/${prev.id}`}
          className="flex flex-1 items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-ink/5"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-lg text-ink/30">←</span>
          <span>
            <span
              className="block text-xs uppercase tracking-widest text-ink/35"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {t("pager.prev")}
            </span>
            <span className="mt-0.5 block text-sm text-ink/75">
              {localizedBlockTitle(prev.id, prev.title, t)}
            </span>
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={`${base}/${next.id}`}
          className="flex flex-1 items-center justify-end gap-3 rounded-xl border p-4 text-right transition-colors hover:bg-ink/5"
          style={{ borderColor: "var(--border)" }}
        >
          <span>
            <span
              className="block text-xs uppercase tracking-widest text-ink/35"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {t("pager.next")}
            </span>
            <span className="mt-0.5 block text-sm text-ink/75">
              {localizedBlockTitle(next.id, next.title, t)}
            </span>
          </span>
          <span className="text-lg text-ink/30">→</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
