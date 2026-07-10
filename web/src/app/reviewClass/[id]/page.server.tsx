/**
 * Curador — revisão de uma aula (SERVER MODE only). Big hanzi for the notebook
 * plus digital practice filtered to the lesson's words. See docs/12 §8.
 */
import { auth } from "@/server/auth";
import { isAdminEmail } from "@/lib/phrase-game/admin";
import { getLesson } from "@/server/db/lessons";
import { LessonHanziPractice } from "@/components/lessons/LessonHanziPractice";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revisão da aula" };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const BOOK_LABEL: Record<string, string> = {
  "primary-up": "初级·上",
  "primary-down": "初级·下",
};

function notAuthorized(email: string | null) {
  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-medium text-ink">Revisão da aula</h1>
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

export default async function ReviewClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!isAdminEmail(email)) return notAuthorized(email);

  const id = Number((await params).id);
  const lesson = Number.isInteger(id) && id > 0 ? getLesson(id) : null;

  if (!lesson) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium text-ink">Aula não encontrada</h1>
        <a href={`${BASE_PATH}/reviewClass`} className="mt-6 inline-flex text-sm text-accent hover:underline">
          ← Voltar às aulas
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8" style={{ fontFamily: "var(--font-sans)" }}>
        <a href={`${BASE_PATH}/reviewClass`} className="text-sm text-accent hover:underline">
          ← Minhas aulas
        </a>
        <h1 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl">
          {lesson.classLabel} · {lesson.lessonDate}
        </h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-ink/50">
          <span>{lesson.words.length} palavra(s)</span>
          {lesson.materialRefs.map((r, i) => (
            <span key={i}>
              {BOOK_LABEL[r.book] ?? r.book} · cap. {r.chapter}
            </span>
          ))}
          <a href={`${BASE_PATH}/registerClass?id=${lesson.id}`} className="text-accent hover:underline">
            Editar
          </a>
        </div>
        {lesson.notes && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink/70">{lesson.notes}</p>
        )}
      </header>

      {/* Hanzi para o caderno */}
      <section className="mb-12">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-ink/40" style={{ fontFamily: "var(--font-sans)" }}>
          Hanzi para o caderno
        </h2>
        <ul className="space-y-6">
          {lesson.words.map((w, i) => (
            <li key={i} className="border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <p className="font-hanzi text-5xl leading-tight text-ink">{w.hanzi}</p>
              <p className="mt-1 text-sm text-ink/50" style={{ fontFamily: "var(--font-sans)" }}>
                {[w.pinyin, w.translation].filter(Boolean).join(" · ")}
                {w.theme ? `  ·  ${w.theme}` : ""}
              </p>
              {w.notes && (
                <p className="mt-1 text-sm text-ink/60" style={{ fontFamily: "var(--font-sans)" }}>
                  {w.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Treino digital */}
      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-ink/40" style={{ fontFamily: "var(--font-sans)" }}>
          Treino digital
        </h2>
        <LessonHanziPractice
          words={lesson.words.map((w) => ({ hanzi: w.hanzi, pinyin: w.pinyin, translation: w.translation }))}
          lessonTitle={`${lesson.classLabel} · ${lesson.lessonDate}`}
          lessonId={lesson.id}
        />
      </section>
    </main>
  );
}
