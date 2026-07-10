"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { withPublicBasePath } from "@/lib/publicBasePath";

export function DeleteLessonButton({ lessonId, label }: { lessonId: number; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm(`Apagar a aula #${lessonId}? As palavras no léxico global são mantidas.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(withPublicBasePath(`/api/lessons/${lessonId}`), {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? `Erro ${res.status} ao apagar.`);
    } catch {
      setError("Falha de rede ao apagar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="text-ink/40 hover:text-danger disabled:opacity-50"
      >
        {busy ? "…" : label}
      </button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </span>
  );
}
