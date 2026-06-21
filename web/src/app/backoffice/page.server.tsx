/**
 * Phrase-game dashboard — SERVER MODE only (`page.server.tsx`; absent under
 * static export). Owner-only view of the game event log: KPIs, an engagement
 * funnel, the hardest phrases, rounds by tier/level, and a filterable activity
 * feed. Filters are plain URL query params (no client JS).
 *
 * Access: the signed-in Google email must pass `isAdminEmail` (NEXT_PUBLIC_ADMIN_EMAIL,
 * defaults to the repo owner).
 */
import { auth } from "@/server/auth";
import { isAdminEmail } from "@/lib/phrase-game/admin";
import { ALL_PHRASES } from "@/lib/phrase-game/phrases";
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
  game_enter: "Entrou no jogo",
  round_start: "Início de rodada",
  phrase_result: "Resultado de frase",
  help_used: "Ajuda usada",
  round_abandon: "Abandono",
  round_complete: "Rodada concluída",
};

const phraseById = new Map(ALL_PHRASES.map((p) => [p.id, p]));

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
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  if (h < 48) return `há ${h}h`;
  return `há ${Math.round(h / 24)}d`;
}

function eventStyle(event: string, correct: number | null): { bg: string; fg: string; label: string } {
  switch (event) {
    case "game_enter":
      return { bg: "rgba(100,116,139,0.14)", fg: "#475569", label: "entrou" };
    case "round_start":
      return { bg: "rgba(45,90,140,0.14)", fg: "var(--accent)", label: "início" };
    case "round_complete":
      return { bg: "rgba(21,128,61,0.14)", fg: "#15803d", label: "concluiu" };
    case "round_abandon":
      return { bg: "rgba(217,119,6,0.16)", fg: "#b45309", label: "abandonou" };
    case "help_used":
      return { bg: "rgba(202,138,4,0.16)", fg: "#a16207", label: "ajuda" };
    case "phrase_result":
      return correct === 1
        ? { bg: "rgba(21,128,61,0.14)", fg: "#15803d", label: "acerto" }
        : { bg: "rgba(185,28,28,0.12)", fg: "#b91c1c", label: "erro" };
    default:
      return { bg: "var(--paper)", fg: "var(--ink)", label: event };
  }
}

function who(row: EventRow): string {
  if (row.nick) return row.nick;
  if (row.email) return row.email;
  if (row.user_id) return `user:${row.user_id.slice(0, 6)}`;
  if (row.anon_id) return `guest:${row.anon_id.slice(0, 6)}`;
  return "—";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!isAdminEmail(email)) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-display text-2xl font-medium text-ink">Dashboard</h1>
        <p className="mt-3 text-sm text-ink/70">
          {email
            ? `A conta ${email} não tem permissão de administrador.`
            : "Inicie sessão com a conta de administrador (na página do jogo) para ver o dashboard."}
        </p>
        <a href={`${BASE_PATH}/phrase-game`} className="mt-4 inline-block text-sm" style={{ color: "var(--accent)" }}>
          ← Voltar ao jogo
        </a>
      </main>
    );
  }

  const sp = await searchParams;
  const whoRaw = one(sp, "who");
  const resultRaw = one(sp, "result");
  const filters: {
    event: string;
    tier: string;
    who: "logged" | "guests" | "";
    result: "correct" | "wrong" | "";
    sinceDays: number;
    limit: number;
  } = {
    event: one(sp, "event"),
    tier: one(sp, "tier"),
    who: whoRaw === "logged" || whoRaw === "guests" ? whoRaw : "",
    result: resultRaw === "correct" || resultRaw === "wrong" ? resultRaw : "",
    sinceDays: Number(one(sp, "since")) || 0,
    limit: Number(one(sp, "limit")) || 200,
  };
  const hasFilters =
    Boolean(filters.event || filters.tier || filters.who || filters.result || filters.sinceDays);

  const stats = eventStats();
  const rows = queryEvents(filters);
  const missed = topMissedPhrases(8);
  const byTL = roundsByTierLevel();

  const enters = stats.byEvent.find((e) => e.event === "game_enter")?.n ?? 0;
  const helps = stats.byEvent.find((e) => e.event === "help_used")?.n ?? 0;
  const answered = stats.correct + stats.wrong;
  const funnelMax = Math.max(enters, stats.rounds, stats.completes, 1);
  const tlMax = Math.max(1, ...byTL.map((r) => r.n));
  const missedMax = Math.max(1, ...missed.map((m) => m.total));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
            Dashboard · Quebra-Cabeça de Frases
          </h1>
          <p className="mt-1 text-sm text-ink/55">
            {email} · {stats.last24h} eventos nas últimas 24h
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <a href={`${BASE_PATH}/backoffice`} className="rounded-full border px-3 py-1.5 text-ink/70 hover:bg-ink/5" style={{ borderColor: "var(--border)" }}>
            ↻ Atualizar
          </a>
          <a href={`${BASE_PATH}/phrase-game`} className="rounded-full border px-3 py-1.5 text-ink/70 hover:bg-ink/5" style={{ borderColor: "var(--border)" }}>
            ← Jogo
          </a>
        </div>
      </header>

      {/* KPIs */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Entradas" value={enters} />
        <Stat label="Rodadas" value={stats.rounds} />
        <Stat label="Concluídas" value={stats.completes} sub={`${pct(stats.completes, stats.rounds)} das rodadas`} tone="good" />
        <Stat label="Abandonos" value={stats.abandons} sub={`${pct(stats.abandons, stats.rounds)} das rodadas`} tone="warn" />
        <Stat label="Precisão" value={pct(stats.correct, answered)} sub={`${stats.correct}✓ / ${stats.wrong}✗`} tone="good" />
        <Stat label="Ajudas" value={helps} />
        <Stat label="Jogadores" value={stats.players} sub="logados" />
        <Stat label="Convidados" value={stats.guests} />
        <Stat label="Acertos" value={stats.correct} tone="good" />
        <Stat label="Erros" value={stats.wrong} tone="bad" />
        <Stat label="Eventos" value={stats.total} />
        <Stat label="Últimas 24h" value={stats.last24h} />
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Section title="Funil de engajamento">
          <div className="space-y-3">
            <FunnelBar label="Entradas" value={enters} max={funnelMax} color="#64748b" />
            <FunnelBar label="Rodadas iniciadas" value={stats.rounds} max={funnelMax} color="var(--accent)" />
            <FunnelBar label="Rodadas concluídas" value={stats.completes} max={funnelMax} color="#15803d" />
            <FunnelBar label="Abandonos" value={stats.abandons} max={funnelMax} color="#b45309" />
          </div>
          <p className="mt-3 text-xs text-ink/45">
            Conclusão {pct(stats.completes, stats.rounds)} · abandono {pct(stats.abandons, stats.rounds)} · precisão {pct(stats.correct, answered)}
          </p>
        </Section>

        {/* Rounds by tier/level */}
        <Section title="Rodadas por nível">
          {byTL.length === 0 ? (
            <p className="text-sm text-ink/45">Sem rodadas ainda.</p>
          ) : (
            <div className="space-y-2">
              {byTL.map((r) => (
                <FunnelBar
                  key={`${r.tier}-${r.level}`}
                  label={`${r.tier ?? "?"} · L${r.level ?? "?"}`}
                  value={r.n}
                  max={tlMax}
                  color="var(--accent)"
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Hardest phrases */}
      <Section title="Frases mais erradas" className="mb-8">
        {missed.length === 0 ? (
          <p className="text-sm text-ink/45">Sem erros registados ainda.</p>
        ) : (
          <div className="space-y-2.5">
            {missed.map((m) => {
              const p = phraseById.get(m.phrase_id);
              return (
                <div key={m.phrase_id} className="flex items-center gap-3">
                  <div className="w-44 shrink-0">
                    <span className="font-hanzi text-base text-ink">{p?.hanzi ?? m.phrase_id}</span>
                    {p?.pt ? <span className="ml-2 text-xs text-ink/45">{p.pt}</span> : null}
                  </div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "var(--paper)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(m.wrong / missedMax) * 100}%`, backgroundColor: "#b91c1c" }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-ink/60">
                    {m.wrong}✗ / {m.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Activity feed + filters */}
      <Section title={`Atividade recente (${rows.length})`}>
        <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
          <Field label="Evento" name="event" value={filters.event}
            options={[["", "Todos"], ...EVENT_NAMES.map((e) => [e, EVENT_LABEL[e]])]} />
          <Field label="Tier" name="tier" value={filters.tier}
            options={[["", "Todos"], ["iniciante", "Iniciante"], ["basico", "Básico"]]} />
          <Field label="Quem" name="who" value={filters.who}
            options={[["", "Todos"], ["logged", "Logados"], ["guests", "Convidados"]]} />
          <Field label="Resultado" name="result" value={filters.result}
            options={[["", "Todos"], ["correct", "Acertos"], ["wrong", "Erros"]]} />
          <Field label="Período" name="since" value={filters.sinceDays ? String(filters.sinceDays) : ""}
            options={[["", "Tudo"], ["1", "24h"], ["7", "7 dias"], ["30", "30 dias"]]} />
          <Field label="Limite" name="limit" value={String(filters.limit)}
            options={[["50", "50"], ["100", "100"], ["200", "200"], ["500", "500"]]} />
          <button type="submit" className="rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>
            Filtrar
          </button>
          {hasFilters ? (
            <a href={`${BASE_PATH}/backoffice`} className="rounded-lg border px-4 py-2 text-xs text-ink/70 hover:bg-ink/5" style={{ borderColor: "var(--border)" }}>
              Limpar
            </a>
          ) : null}
        </form>

        {rows.length === 0 ? (
          <p className="text-sm text-ink/45">Nenhum evento para estes filtros.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="text-ink/55" style={{ backgroundColor: "var(--paper)" }}>
                  <Th>Quando</Th>
                  <Th>Evento</Th>
                  <Th>Quem</Th>
                  <Th>Nível</Th>
                  <Th>Frase</Th>
                  <Th>Tentativa / detalhe</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = eventStyle(r.event, r.correct);
                  const p = r.phrase_id ? phraseById.get(r.phrase_id) : undefined;
                  return (
                    <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <Td>
                        <span className="text-ink/70">{ago(r.created_at)}</span>
                        <span className="ml-1 text-ink/30" style={{ fontFamily: "ui-monospace, monospace" }}>
                          {r.created_at.slice(11, 16)}
                        </span>
                      </Td>
                      <Td>
                        <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-medium" style={{ backgroundColor: st.bg, color: st.fg }}>
                          {st.label}
                        </span>
                      </Td>
                      <Td>{who(r)}</Td>
                      <Td>{r.tier ? `${r.tier}/L${r.level ?? "?"}` : ""}</Td>
                      <Td>{p ? <span className="font-hanzi text-sm text-ink">{p.hanzi}</span> : r.phrase_id ?? ""}</Td>
                      <Td>
                        <span className="font-hanzi text-ink/80">{r.attempt ?? ""}</span>
                        {r.detail ? <span className="text-ink/45">{r.attempt ? " · " : ""}{r.detail}</span> : null}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </main>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: number | string; sub?: string; tone?: "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "#15803d" : tone === "bad" ? "#b91c1c" : tone === "warn" ? "#b45309" : "var(--ink)";
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}>
      <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
      <p className="mt-0.5 text-xs font-medium text-ink/70">{label}</p>
      {sub ? <p className="mt-0.5 text-[0.65rem] text-ink/40">{sub}</p> : null}
    </div>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
        {children}
      </div>
    </section>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-xs text-ink/65">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "var(--paper)" }}>
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-medium text-ink">{value}</span>
    </div>
  );
}

function Field({ label, name, value, options }: { label: string; name: string; value: string; options: string[][] }) {
  return (
    <label className="flex flex-col gap-1 text-[0.65rem] text-ink/55">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="rounded-lg border px-2 py-1.5 text-xs text-ink"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}
      >
        {options.map((o) => (
          <option key={o[0]} value={o[0]}>{o[1]}</option>
        ))}
      </select>
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-2 font-medium">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-3 py-1.5 align-top text-ink/80">{children}</td>;
}
