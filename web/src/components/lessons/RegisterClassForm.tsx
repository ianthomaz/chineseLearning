"use client";

import { useState } from "react";
import { withPublicBasePath } from "@/lib/publicBasePath";
import type { ClassRow } from "@/server/db/classes";
import type { LessonDetail, MaterialRef } from "@/server/db/lessons";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const BOOK_OPTIONS: { value: MaterialRef["book"]; label: string }[] = [
  { value: "primary-up", label: "初级·上 (primary-up)" },
  { value: "primary-down", label: "初级·下 (primary-down)" },
];
const CHAPTERS = Array.from({ length: 16 }, (_, i) => i + 1);

type WordRow = {
  key: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  notes: string;
  theme: string;
};

type RefRow = { key: string; book: MaterialRef["book"]; chapter: number };

function newKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `k${Math.random().toString(36).slice(2)}${Date.now()}`;
}

function emptyWord(hanzi = ""): WordRow {
  return { key: newKey(), hanzi, pinyin: "", translation: "", notes: "", theme: "" };
}

const inputClass =
  "w-full rounded-lg border px-2 py-1.5 text-sm outline-none focus:border-accent";
const inputStyle = { borderColor: "var(--border)", fontFamily: "ui-sans-serif, system-ui, sans-serif" };

export function RegisterClassForm({
  classes,
  initialLesson,
}: {
  classes: ClassRow[];
  initialLesson: LessonDetail | null;
}) {
  const editing = initialLesson !== null;
  const [lessonDate, setLessonDate] = useState(initialLesson?.lessonDate ?? "");
  const [classId, setClassId] = useState(initialLesson?.classId ?? classes[0]?.id ?? "");
  const [generalNotes, setGeneralNotes] = useState(initialLesson?.notes ?? "");
  const [refs, setRefs] = useState<RefRow[]>(
    (initialLesson?.materialRefs ?? []).map((r) => ({ key: newKey(), ...r })),
  );
  const [words, setWords] = useState<WordRow[]>(
    (initialLesson?.words ?? []).map((w) => ({
      key: newKey(),
      hanzi: w.hanzi,
      pinyin: w.pinyin ?? "",
      translation: w.translation ?? "",
      notes: w.notes ?? "",
      theme: w.theme ?? "",
    })),
  );
  const [pasteText, setPasteText] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "error"; msg: string } | { kind: "saved"; id: number }
  >({ kind: "idle" });

  function generateWords() {
    const parsed = pasteText
      .split(/[,，、\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length === 0) return;
    const existing = new Set(words.map((w) => w.hanzi));
    const additions = parsed.filter((h) => !existing.has(h)).map((h) => emptyWord(h));
    setWords((prev) => [...prev, ...additions]);
    setPasteText("");
  }

  function updateWord(key: string, field: keyof WordRow, value: string) {
    setWords((prev) => prev.map((w) => (w.key === key ? { ...w, [field]: value } : w)));
  }

  function removeWord(key: string) {
    setWords((prev) => prev.filter((w) => w.key !== key));
  }

  function addRef() {
    setRefs((prev) => [...prev, { key: newKey(), book: "primary-up", chapter: 1 }]);
  }

  function updateRef(key: string, field: "book" | "chapter", value: string) {
    setRefs((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, [field]: field === "chapter" ? Number(value) : (value as MaterialRef["book"]) }
          : r,
      ),
    );
  }

  function removeRef(key: string) {
    setRefs((prev) => prev.filter((r) => r.key !== key));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanWords = words.filter((w) => w.hanzi.trim());
    if (!lessonDate) return setStatus({ kind: "error", msg: "Informe a data da aula." });
    if (!classId) return setStatus({ kind: "error", msg: "Escolha a classe." });
    if (cleanWords.length === 0) return setStatus({ kind: "error", msg: "Adicione ao menos uma palavra." });

    setStatus({ kind: "saving" });
    const body = {
      lessonDate,
      classId,
      notes: generalNotes || null,
      materialRefs: refs.map(({ book, chapter }) => ({ book, chapter })),
      words: cleanWords.map((w) => ({
        hanzi: w.hanzi.trim(),
        pinyin: w.pinyin.trim() || null,
        translation: w.translation.trim() || null,
        notes: w.notes.trim() || null,
        theme: w.theme.trim() || null,
      })),
    };
    const url = editing
      ? withPublicBasePath(`/api/lessons/${initialLesson.id}`)
      : withPublicBasePath("/api/lessons");
    try {
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: number; error?: string; field?: string };
      if (!res.ok) {
        setStatus({ kind: "error", msg: data.field ? `Campo inválido: ${data.field}` : data.error ?? "Erro ao guardar." });
        return;
      }
      setStatus({ kind: "saved", id: editing ? initialLesson.id : (data.id ?? 0) });
    } catch {
      setStatus({ kind: "error", msg: "Falha de rede ao guardar." });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      {/* Meta */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink/70">Data da aula *</span>
          <input
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            className={inputClass}
            style={inputStyle}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink/70">Classe *</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass} style={inputStyle}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Material refs */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-ink/70">Material de referência (opcional)</span>
          <button type="button" onClick={addRef} className="text-sm text-accent hover:underline">
            + material
          </button>
        </div>
        {refs.length === 0 ? (
          <p className="text-xs text-ink/40">Sem vínculo a livro/capítulo — válido.</p>
        ) : (
          <div className="space-y-2">
            {refs.map((r) => (
              <div key={r.key} className="flex flex-wrap items-center gap-2">
                <select value={r.book} onChange={(e) => updateRef(r.key, "book", e.target.value)} className="rounded-lg border px-2 py-1.5 text-sm" style={inputStyle}>
                  {BOOK_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <select value={r.chapter} onChange={(e) => updateRef(r.key, "chapter", e.target.value)} className="rounded-lg border px-2 py-1.5 text-sm" style={inputStyle}>
                  {CHAPTERS.map((c) => (
                    <option key={c} value={c}>
                      Cap. {c}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => removeRef(r.key)} className="text-sm text-ink/40 hover:text-ink">
                  remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paste */}
      <div>
        <span className="mb-1 block text-sm font-medium text-ink/70">Colar hanzi (separados por vírgula)</span>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={2}
          placeholder="饮食,丰富,面条,学生会,报名"
          className={inputClass}
          style={inputStyle}
        />
        <button type="button" onClick={generateWords} className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>
          Gerar tabela
        </button>
      </div>

      {/* Word table */}
      {words.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-2 py-1">Hanzi</th>
                <th className="px-2 py-1">Pinyin</th>
                <th className="px-2 py-1">Tradução</th>
                <th className="px-2 py-1">Notas</th>
                <th className="px-2 py-1">Tema</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.key}>
                  <td className="px-1 py-1">
                    <input value={w.hanzi} onChange={(e) => updateWord(w.key, "hanzi", e.target.value)} className={`${inputClass} font-hanzi`} style={inputStyle} />
                  </td>
                  <td className="px-1 py-1">
                    <input value={w.pinyin} onChange={(e) => updateWord(w.key, "pinyin", e.target.value)} className={inputClass} style={inputStyle} />
                  </td>
                  <td className="px-1 py-1">
                    <input value={w.translation} onChange={(e) => updateWord(w.key, "translation", e.target.value)} className={inputClass} style={inputStyle} />
                  </td>
                  <td className="px-1 py-1">
                    <input value={w.notes} onChange={(e) => updateWord(w.key, "notes", e.target.value)} className={inputClass} style={inputStyle} />
                  </td>
                  <td className="px-1 py-1">
                    <input value={w.theme} onChange={(e) => updateWord(w.key, "theme", e.target.value)} className={inputClass} style={inputStyle} />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button type="button" onClick={() => removeWord(w.key)} className="text-ink/40 hover:text-ink" title="Remover">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-ink/40">{words.filter((w) => w.hanzi.trim()).length} palavra(s)</p>
        </div>
      )}

      {/* General notes */}
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Notas gerais</span>
        <textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} rows={3} className={inputClass} style={inputStyle} />
      </label>

      {/* Submit */}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status.kind === "saving"} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>
          {status.kind === "saving" ? "A guardar…" : editing ? "Guardar alterações" : "Guardar aula"}
        </button>
        {status.kind === "error" && <span className="text-sm text-red-600">{status.msg}</span>}
        {status.kind === "saved" && (
          <span className="flex flex-wrap items-center gap-3 text-sm text-green-700">
            Aula guardada.
            <a href={`${BASE_PATH}/reviewClass/${status.id}`} className="text-accent hover:underline">
              Ver aula
            </a>
            <a href={`${BASE_PATH}/registerClass`} className="text-accent hover:underline">
              Nova aula
            </a>
          </span>
        )}
      </div>
    </form>
  );
}
