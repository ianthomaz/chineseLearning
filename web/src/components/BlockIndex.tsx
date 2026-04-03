"use client";

import Link from "next/link";
import { BlockTitleText } from "@/components/BlockTitleText";
import type { ContentBlock } from "@/lib/blocks";
import { useLocale } from "@/context/LocaleContext";

type Mode = "review" | "vocabulary" | "grammar";

type Props = {
  blocks: ContentBlock[];
  mode: Mode;
};

const path: Record<Mode, string> = {
  review: "/review",
  vocabulary: "/vocabulary",
  grammar: "/grammar",
};

const modeLabelKey: Record<Mode, string> = {
  review: "blockIndex.phrases",
  vocabulary: "blockIndex.words",
  grammar: "blockIndex.rules",
};

const modeCountFn: Record<Mode, (b: ContentBlock) => number | null> = {
  review: (b) => (b.structures.length > 0 ? b.structures.length : null),
  vocabulary: (b) => (b.vocabulary.length > 0 ? b.vocabulary.length : null),
  grammar: (b) => {
    const n = b.structures.length + b.notes.length + b.differences.length;
    return n > 0 ? n : null;
  },
};

export function BlockIndex({ blocks, mode }: Props) {
  const { t } = useLocale();
  const base = path[mode];
  const label = t(modeLabelKey[mode]);
  const countFn = modeCountFn[mode];

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
      {blocks.map((b) => {
        const count = countFn(b);
        return (
          <Link
            key={b.id}
            href={`${base}/${b.id}`}
            className="group flex items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-ink/[0.03]"
            style={{ borderColor: "var(--border)" }}
          >
            <span
              className="mt-0.5 w-7 shrink-0 text-right text-xs tabular-nums text-ink/25"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {String(b.id).padStart(2, "0")}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-ink/85 transition-colors group-hover:text-ink">
                <BlockTitleText id={b.id} title={b.title} />
              </span>
              {count !== null ? (
                <span
                  className="mt-0.5 block text-xs text-ink/35"
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                >
                  {count} {label}
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 text-xs text-ink/20 transition-colors group-hover:text-ink/40">
              →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
