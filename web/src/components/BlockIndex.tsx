import Link from "next/link";
import type { ContentBlock } from "@/lib/blocks";

type Props = {
  blocks: ContentBlock[];
  mode: "review" | "vocabulary" | "grammar";
};

const path = {
  review: "/review",
  vocabulary: "/vocabulary",
  grammar: "/grammar",
} as const;

export function BlockIndex({ blocks, mode }: Props) {
  const base = path[mode];
  return (
    <ol className="mx-auto max-w-2xl list-decimal space-y-3 px-5 py-10 pl-10 marker:text-ink/40">
      {blocks.map((b) => (
        <li key={b.id} className="pl-2">
          <Link
            href={`${base}/${b.id}`}
            className="text-lg text-ink underline decoration-ink/20 decoration-1 underline-offset-4 hover:decoration-accent hover:decoration-2"
          >
            {b.title}
          </Link>
        </li>
      ))}
    </ol>
  );
}
