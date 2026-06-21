/**
 * Phrase-game backoffice — SERVER MODE only (`page.server.tsx`; absent under
 * static export). Owner-only view of the game event log (entries, abandons,
 * correct/wrong, completions) for logged-in and anonymous players.
 *
 * Access: the signed-in Google account email must be in ADMIN_EMAIL
 * (comma-separated). Defaults to the repo owner when unset.
 */
import { auth } from "@/server/auth";
import { eventStats, recentEvents, type EventRow } from "@/server/db/events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Backoffice · Quebra-Cabeça de Frases" };

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? "ianthomaz@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function who(row: EventRow): string {
  if (row.nick) return row.nick;
  if (row.email) return row.email;
  if (row.user_id) return `user:${row.user_id.slice(0, 8)}`;
  if (row.anon_id) return `guest:${row.anon_id.slice(0, 8)}`;
  return "—";
}

function correctMark(c: number | null): string {
  if (c === 1) return "✓";
  if (c === 0) return "✗";
  return "";
}

export default async function BackofficePage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? null;
  const isAdmin = email !== null && adminEmails().includes(email);

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-display text-2xl font-medium text-ink">Backoffice</h1>
        <p className="mt-3 text-sm text-ink/70">
          {email
            ? `A conta ${email} não tem permissão de administrador.`
            : "Inicie sessão com a conta de administrador (na página do jogo) para ver o histórico."}
        </p>
      </main>
    );
  }

  const stats = eventStats();
  const rows = recentEvents(200);

  const cards: Array<{ label: string; value: number }> = [
    { label: "Eventos (total)", value: stats.total },
    { label: "Últimas 24h", value: stats.last24h },
    { label: "Rodadas iniciadas", value: stats.rounds },
    { label: "Concluídas", value: stats.completes },
    { label: "Abandonos", value: stats.abandons },
    { label: "Acertos", value: stats.correct },
    { label: "Erros", value: stats.wrong },
    { label: "Logados", value: stats.players },
    { label: "Convidados", value: stats.guests },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
          Backoffice · histórico do jogo
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          {email} · {rows.length} eventos recentes
        </p>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}
          >
            <p className="text-2xl font-semibold text-ink">{c.value}</p>
            <p className="mt-0.5 text-xs text-ink/55">{c.label}</p>
          </div>
        ))}
      </section>

      {stats.byEvent.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-ink">Por tipo de evento</h2>
          <div className="flex flex-wrap gap-2">
            {stats.byEvent.map((e) => (
              <span
                key={e.event}
                className="rounded-full border px-3 py-1 text-xs text-ink/70"
                style={{ borderColor: "var(--border)" }}
              >
                {e.event}: <strong className="text-ink">{e.n}</strong>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Eventos recentes</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-ink/55">Ainda não há eventos registados.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="text-ink/55" style={{ backgroundColor: "var(--paper)" }}>
                  <Th>Quando (UTC)</Th>
                  <Th>Evento</Th>
                  <Th>Quem</Th>
                  <Th>Nível</Th>
                  <Th>Frase</Th>
                  <Th>OK</Th>
                  <Th>Tentativa / detalhe</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <Td mono>{r.created_at}</Td>
                    <Td>{r.event}</Td>
                    <Td>{who(r)}</Td>
                    <Td>{r.tier ? `${r.tier}/L${r.level ?? "?"}` : ""}</Td>
                    <Td mono>{r.phrase_id ?? ""}</Td>
                    <Td>{correctMark(r.correct)}</Td>
                    <Td mono>{r.attempt ?? r.detail ?? ""}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      className={`px-3 py-1.5 align-top text-ink/80 ${mono ? "" : ""}`}
      style={mono ? { fontFamily: "ui-monospace, monospace" } : undefined}
    >
      {children}
    </td>
  );
}
