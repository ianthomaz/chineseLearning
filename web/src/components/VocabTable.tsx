import type { VocabRow } from "@/lib/blocks";

type Props = {
  rows: VocabRow[];
};

export function VocabTable({ rows }: Props) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink/20">
            <th className="pb-3 pr-4 font-medium text-ink/60">Hanzi</th>
            <th className="pb-3 pr-4 font-medium text-ink/60">Pinyin</th>
            <th className="pb-3 font-medium text-ink/60">Tradução</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.hanzi}-${row.pinyin}`} className="border-b border-ink/10">
              <td className="py-2.5 pr-4 font-hanzi text-base text-ink">
                {row.hanzi}
              </td>
              <td className="py-2.5 pr-4 italic text-ink/80">{row.pinyin}</td>
              <td className="py-2.5 text-ink/90">{row.translation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
