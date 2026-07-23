/**
 * Private lyric-card KTV viewer — curator/admin email only (SERVER MODE).
 */
import { auth } from "@/server/auth";
import { isAdminEmail } from "@/lib/phrase-game/admin";
import { LyricsKtvSession } from "@/components/lyrics-ktv/LyricsKtvSession";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lyric Cards" };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default async function KtvPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!isAdminEmail(email)) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium text-ink">Lyric Cards</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/65">
          {email
            ? `A conta ${email} não tem acesso a esta área.`
            : "Inicie sessão com a conta autorizada para continuar."}
        </p>
        <a
          href={`${BASE_PATH}/`}
          className="mt-6 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Voltar ao site
        </a>
      </main>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <LyricsKtvSession />
    </div>
  );
}
