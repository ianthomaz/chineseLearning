/**
 * Curador — histórico de aulas (SERVER MODE only). Gated to the curator email.
 * Links to per-lesson review, edit and delete. See docs/12 §8.
 */
import { auth } from "@/server/auth";
import { isAdminEmail } from "@/lib/phrase-game/admin";
import { listLessons } from "@/server/db/lessons";
import { DeleteLessonButton } from "@/components/lessons/DeleteLessonButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minhas aulas" };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default async function ReviewClassPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!isAdminEmail(email)) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium text-ink">Minhas aulas</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/65">
          {email
            ? `A conta ${email} não tem permissão de curador.`
            : "Inicie sessão com a conta de curador na página do jogo."}
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

  const lessons = listLessons();

  return (
    <main
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ink/40">Curador</p>
          <h1 className="mt-1 font-display text-2xl font-medium text-ink sm:text-3xl">Minhas aulas</h1>
        </div>
        <a
          href={`${BASE_PATH}/registerClass`}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          + Cadastrar
        </a>
      </header>

      {lessons.length === 0 ? (
        <p className="text-sm text-ink/50">Nenhuma aula registada ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-ink/40" style={{ borderColor: "var(--border)" }}>
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Classe</th>
                <th className="py-2 pr-3">Palavras</th>
                <th className="py-2 pr-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2 pr-3 tabular-nums">{l.lessonDate}</td>
                  <td className="py-2 pr-3">{l.classLabel}</td>
                  <td className="py-2 pr-3 tabular-nums">{l.wordCount}</td>
                  <td className="py-2 pr-3">
                    <span className="flex flex-wrap gap-3">
                      <a href={`${BASE_PATH}/reviewClass/${l.id}`} className="text-accent hover:underline">
                        Rever
                      </a>
                      <a href={`${BASE_PATH}/registerClass?id=${l.id}`} className="text-ink/60 hover:text-ink">
                        Editar
                      </a>
                      <DeleteLessonButton lessonId={l.id} label="Apagar" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
