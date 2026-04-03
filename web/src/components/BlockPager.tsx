import Link from "next/link";
import { blocks } from "@/lib/blocks";

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
  const base = path[mode];
  const idx = blocks.findIndex((b) => b.id === blockId);
  const prev = idx > 0 ? blocks[idx - 1] : null;
  const next = idx >= 0 && idx < blocks.length - 1 ? blocks[idx + 1] : null;

  return (
    <nav
      className="mt-12 flex flex-col gap-4 border-t border-ink/15 pt-8 sm:flex-row sm:justify-between"
      aria-label="Bloco anterior ou seguinte"
    >
      {prev ? (
        <Link
          href={`${base}/${prev.id}`}
          className="text-sm text-ink/70 hover:text-ink"
        >
          <span className="block text-xs uppercase tracking-widest text-ink/40">
            Anterior
          </span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`${base}/${next.id}`}
          className="text-right text-sm text-ink/70 hover:text-ink sm:ml-auto"
        >
          <span className="block text-xs uppercase tracking-widest text-ink/40">
            Seguinte
          </span>
          {next.title}
        </Link>
      ) : null}
    </nav>
  );
}
