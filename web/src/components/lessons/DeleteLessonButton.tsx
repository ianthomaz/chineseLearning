"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { withPublicBasePath } from "@/lib/publicBasePath";

export function DeleteLessonButton({ lessonId, label }: { lessonId: number; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Apagar a aula #${lessonId}? As palavras no léxico global são mantidas.`)) return;
    setBusy(true);
    try {
      const res = await fetch(withPublicBasePath(`/api/lessons/${lessonId}`), {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        router.refresh();
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="text-ink/40 hover:text-danger disabled:opacity-50"
    >
      {busy ? "…" : label}
    </button>
  );
}
