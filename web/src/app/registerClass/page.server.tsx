/**
 * Curador — cadastrar / editar aula (SERVER MODE only). Gated to the curator
 * email like /backoffice. Edit an existing lesson via ?id=. See docs/12 §4-7.
 */
import { auth } from "@/server/auth";
import { isAdminEmail } from "@/lib/phrase-game/admin";
import { listClasses } from "@/server/db/classes";
import { getLesson } from "@/server/db/lessons";
import { RegisterClassForm } from "@/components/lessons/RegisterClassForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cadastrar aula" };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type SP = Record<string, string | string[] | undefined>;
const one = (sp: SP, key: string): string => {
  const v = sp[key];
  return typeof v === "string" ? v : "";
};

export default async function RegisterClassPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!isAdminEmail(email)) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium text-ink">Cadastrar aula</h1>
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

  const sp = await searchParams;
  const idRaw = Number(one(sp, "id"));
  const editingId = Number.isInteger(idRaw) && idRaw > 0 ? idRaw : null;
  const initialLesson = editingId ? getLesson(editingId) : null;
  const classes = listClasses();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-ink/40">Curador</p>
        <h1 className="mt-1 font-display text-2xl font-medium text-ink sm:text-3xl">
          {initialLesson ? `Editar aula #${initialLesson.id}` : "Cadastrar aula"}
        </h1>
        {editingId && !initialLesson && (
          <p className="mt-2 text-sm text-red-600">Aula #{editingId} não encontrada — a criar uma nova.</p>
        )}
      </header>
      <RegisterClassForm classes={classes} initialLesson={initialLesson} />
    </main>
  );
}
