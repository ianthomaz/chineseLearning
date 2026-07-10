/**
 * Phrase-game dashboard — SERVER MODE only. Owner-only analytics from the SQLite
 * event log. Filters via URL query params (no client JS).
 */
import { auth } from "@/server/auth";
import { isAdminEmail } from "@/lib/phrase-game/admin";
import { getAllPhrases } from "@/lib/phrase-game/phrases";
import {
  eventStats,
  queryEvents,
  roundsByTierLevel,
  topMissedPhrases,
  type EventRow,
} from "@/server/db/events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Quebra-Cabeça de Frases" };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const EVENT_NAMES = [
  "game_enter",
  "round_start",
  "phrase_result",
  "help_used",
  "round_abandon",
  "round_complete",
] as const;

const EVENT_LABEL: Record<string, string> = {
  game_enter: "Entrou",
  round_start: "Rodada",
  phrase_result: "Frase",
  help_used: "Ajuda",
  round_abandon: "Abandonou",
  round_complete: "Concluiu",
};

type SP = Record<string, string | string[] | undefined>;
const one = (sp: SP, key: string): string => {
  const v = sp[key];
  return typeof v === "string" ? v : "";
};

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

function ago(utc: string): string {
  const t = Date.parse(utc.replace(" ", "T") + "Z");
  if (Number.isNaN(t)) return utc;
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function eventBadge(event: string, correct: number | null): { bg: string; fg: string; label: string } {
  switch (event) {
    case "game_enter":
      return { bg: "#f1f5f9", fg: "#475569", label: EVENT_LABEL.game_enter };
    case "round_start":
      return { bg: "rgba(45,90,140,0.12)", fg: "var(--accent)", label: EVENT_LABEL.round_start };
    case "round_complete":
      return { bg: "#dcfce7", fg: "#166534", label: EVENT_LABEL.round_complete };
    case "round_abandon":
      return { bg: "#ffedd5", fg: "#c2410c", label: EVENT_LABEL.round_abandon };
    case "help_used":
      return { bg: "#fef9c3", fg: "#a16207", label: EVENT_LABEL.help_used };
    case "phrase_result":
      return correct === 1
        ? { bg: "#dcfce7", fg: "#166534", label: "Acerto" }
        : { bg: "#fee2e2", fg: "#b91c1c", label: "Erro" };
    default:
      return { bg: "var(--paper)", fg: "var(--ink)", label: event };
  }
}

function who(row: EventRow): string {
  if (row.nick) return row.nick;
  if (row.email) return row.email.split("@")[0] ?? row.email;
  if (row.user_id) return `user:${row.user_id.slice(0, 6)}`;
  if (row.anon_id) return `convidado`;
  return "—";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!isAdminEmail(email)) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium text-ink">Dashboard</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/65">
          {email
            ? `A conta ${email} não tem permissão de administrador.`
            : "Inicie sessão com a conta de administrador na página do jogo."}
        </p>
        <a
          href={`${BASE_PATH}/phrase-game`}
          className="mt-6 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Ir ao jogo
        </a>
      </main>
    );
  }

  const sp = await searchParams;
  const whoRaw = one(sp, "who");
  const resultRaw = one(sp, "result");
  const filters = {
    event: one(sp, "event"),
    tier: one(sp, "tier"),
    who: whoRaw === "logged" || whoRaw === "guests" ? whoRaw : ("" as "" | "logged" | "guests"),
    result: resultRaw === "correct" || resultRaw === "wrong" ? resultRaw : ("" as "" | "correct" | "wrong"),
    sinceDays: Number(one(sp, "since")) || 0,
    limit: Number(one(sp, "limit")) || 100,
  };
  const hasFilters = Boolean(filters.event || filters.tier || filters.who || filters.result || filters.sinceDays);

  const stats = eventStats();
  const rows = queryEvents(filters);
  const phraseById = new Map(getAllPhrases().map((p) => [p.id, p]));
  const missed = topMissedPhrases(6);
  const byTL = roundsByTierLevel();

  const enters = stats.byEvent.find((e) => e.event === "game_enter")?.n ?? 0;
  const helps = stats.byEvent.find((e) => e.event === "help_used")?.n ?? 0;
  const answered = stats.correct + stats.wrong;
  const funnelMax = Math.max(enters, stats.rounds, stats.completes, 1);
  const tlMax = Math.max(1, ...byTL.map((r) => r.n));
  const missedMax = Math.max(1, ...missed.map((m) => m.wrong));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ink/40">Backoffice</p>
          <h1 className="mt-1 font-display text-2xl font-medium text-ink sm:text-3xl">
            Quebra-Cabeça de Frases
          </h1>
          <p className="mt-2 text-sm text-ink/50">
            {stats.total} eventos no total · {stats.last24h} nas últimas 24h
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`${BASE_PATH}/backoffice`}
            className="rounded-xl border px-4 py-2 text-xs font-medium text-ink/70 transition-colors hover:bg-ink/5"
            style={{ borderColor: "var(--border)" }}
          >
            Atualizar
          </a>
          <a
            href={`${BASE_PATH}/phrase-game`}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Jogo
          </a>
        </div>
      </header>

      {/* Primary KPIs — 4 cards, not 12 */}
      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Últimas 24h"
          value={stats.last24h}
          hint="eventos registados"
          accent
        />
        <Kpi
          label="Rodadas"
          value={stats.rounds}
          hint={`${stats.completes} concluídas (${pct(stats.completes, stats.rounds)})`}
        />
        <Kpi
          label="Precisão"
          value={pct(stats.correct, answered)}
          hint={answered > 0 ? `${stats.correct} acertos · ${stats.wrong} erros` : "sem respostas ainda"}
          tone={stats.correct > stats.wrong ? "good" : undefined}
        />
        <Kpi
          label="Jogadores"
          value={stats.players + stats.guests}
          hint={`${stats.players} logados · ${stats.guests} convidados`}
        />
      </section>

      {/* Insights row */}
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <Panel title="Funil">
          <div className="space-y-3.5">
            <Bar label="Visitas ao jogo" value={enters} max={funnelMax} color="#94a3b8" />
            <Bar label="Rodadas iniciadas" value={stats.rounds} max={funnelMax} color="var(--accent)" />
            <Bar label="Rodadas concluídas" value={stats.completes} max={funnelMax} color="#16a34a" />
            <Bar label="Abandonos" value={stats.abandons} max={funnelMax} color="#ea580c" />
          </div>
          <p className="mt-4 border-t pt-3 text-xs text-ink/45" style={{ borderColor: "var(--border)" }}>
            {helps} ajudas usadas · abandono {pct(stats.abandons, stats.rounds)}
          </p>
        </Panel>

        <Panel title="Por nível">
          {byTL.length === 0 ? (
            <Empty hint="Nenhuma rodada registada ainda." />
          ) : (
            <div className="space-y-2.5">
              {byTL.map((r) => (
                <Bar
                  key={`${r.tier}-${r.level}`}
                  label={tierLabel(r.tier, r.level)}
                  value={r.n}
                  max={tlMax}
                  color="var(--accent)"
                />
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* Hardest phrases */}
      <Panel title="Frases mais difíceis" className="mb-8">
        {missed.length === 0 ? (
          <Empty hint="Sem erros registados — ótimo sinal!" />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {missed.map((m, i) => {
              const p = phraseById.get(m.phrase_id);
              const rate = m.total > 0 ? Math.round((m.wrong / m.total) * 100) : 0;
              return (
                <li key={m.phrase_id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-hanzi text-lg leading-snug text-ink">{p?.hanzi ?? m.phrase_id}</p>
                    {p?.pinyin ? <p className="text-xs text-ink/45">{p.pinyin}</p> : null}
                    {p?.pt ? <p className="mt-0.5 text-xs text-ink/55">{p.pt}</p> : null}
                  </div>
                  <div className="flex items-center gap-3 sm:w-44">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className="h-full rounded-full bg-red-600/70"
                        style={{ width: `${(m.wrong / missedMax) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-ink/60">
                      {m.wrong}✗ <span className="text-ink/35">({rate}%)</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* Activity feed */}
      <Panel title="Atividade recente">
        <form method="get" className="mb-5 flex flex-wrap gap-2">
          <FilterSelect label="Evento" name="event" value={filters.event}
            options={[["", "Todos"], ...EVENT_NAMES.map((e) => [e, EVENT_LABEL[e]])]} />
          <FilterSelect label="Tier" name="tier" value={filters.tier}
            options={[["", "Todos"], ["iniciante", "Iniciante"], ["basico", "Básico"]]} />
          <FilterSelect label="Quem" name="who" value={filters.who}
            options={[["", "Todos"], ["logged", "Logados"], ["guests", "Convidados"]]} />
          <FilterSelect label="Resultado" name="result" value={filters.result}
            options={[["", "Todos"], ["correct", "Acertos"], ["wrong", "Erros"]]} />
          <FilterSelect label="Período" name="since" value={filters.sinceDays ? String(filters.sinceDays) : ""}
            options={[["", "Tudo"], ["1", "24h"], ["7", "7d"], ["30", "30d"]]} />
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Filtrar
            </button>
            {hasFilters ? (
              <a
                href={`${BASE_PATH}/backoffice`}
                className="rounded-xl border px-4 py-2 text-xs text-ink/60 hover:bg-ink/5"
                style={{ borderColor: "var(--border)" }}
              >
                Limpar
              </a>
            ) : null}
          </div>
        </form>

        {rows.length === 0 ? (
          <Empty hint="Nenhum evento para estes filtros." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {rows.map((r) => (
              <ActivityRow key={r.id} row={r} phraseById={phraseById} />
            ))}
          </ul>
        )}
        <p className="mt-3 text-center text-[0.65rem] text-ink/35">
          Mostrando {rows.length} eventos · limite {filters.limit}
        </p>
      </Panel>
    </main>
  );
}

function tierLabel(tier: string | null, level: number | null): string {
  const t = tier === "iniciante" ? "Iniciante" : tier === "basico" ? "Básico" : tier ?? "?";
  return `${t} · nível ${level ?? "?"}`;
}

function Kpi({
  label,
  value,
  hint,
  accent,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
  tone?: "good";
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: accent ? "rgba(45,90,140,0.25)" : "var(--border)",
        backgroundColor: accent ? "rgba(45,90,140,0.06)" : "rgba(255,255,255,0.45)",
      }}
    >
      <p
        className="font-display text-3xl font-medium tabular-nums"
        style={{ color: tone === "good" ? "#166534" : accent ? "var(--accent)" : "var(--ink)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-ink/75">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink/45">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 font-display text-base font-medium text-ink">{title}</h2>
      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.45)" }}
      >
        {children}
      </div>
    </section>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-xs text-ink/60 sm:w-36">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/8">
        <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-ink">{value}</span>
    </div>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[][];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.65rem] font-medium uppercase tracking-wide text-ink/40">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="rounded-xl border bg-white/60 px-3 py-2 text-xs text-ink"
        style={{ borderColor: "var(--border)" }}
      >
        {options.map((o) => (
          <option key={o[0]} value={o[0]}>
            {o[1]}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActivityRow({
  row,
  phraseById,
}: {
  row: EventRow;
  phraseById: Map<string, { hanzi: string; pt?: string }>;
}) {
  const badge = eventBadge(row.event, row.correct);
  const p = row.phrase_id ? phraseById.get(row.phrase_id) : undefined;
  const level = row.tier ? `${row.tier} L${row.level ?? "?"}` : null;

  return (
    <li className="flex gap-3 py-3 sm:gap-4">
      <div className="w-12 shrink-0 pt-0.5 text-right">
        <p className="text-xs font-medium tabular-nums text-ink/50">{ago(row.created_at)}</p>
        <p className="text-[0.6rem] tabular-nums text-ink/30">{row.created_at.slice(11, 16)}</p>
      </div>

      <span
        className="mt-0.5 inline-flex h-6 shrink-0 items-center rounded-lg px-2 text-[0.65rem] font-semibold"
        style={{ backgroundColor: badge.bg, color: badge.fg }}
      >
        {badge.label}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink/80">
          <span className="font-medium text-ink">{who(row)}</span>
          {level ? <span className="text-ink/40"> · {level}</span> : null}
        </p>
        {(p || row.attempt || row.detail) ? (
          <p className="mt-0.5 text-xs text-ink/55">
            {p ? <span className="font-hanzi text-sm text-ink">{p.hanzi}</span> : null}
            {row.attempt ? (
              <span className={p ? " ml-2 text-ink/40" : ""}>
                {p ? "→ " : ""}
                <span className="font-hanzi text-ink/70">{row.attempt}</span>
              </span>
            ) : null}
            {row.detail ? <span className="text-ink/40">{row.attempt || p ? " · " : ""}{row.detail}</span> : null}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function Empty({ hint }: { hint: string }) {
  return <p className="py-6 text-center text-sm text-ink/45">{hint}</p>;
}
