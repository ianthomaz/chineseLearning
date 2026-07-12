/** Class (turma) config rows, seeded in the MIGRATION (server-only). */
import { getDb } from "./index";

export type ClassRow = {
  id: string;
  label: string;
};

/** node:sqlite rows use null-prototype objects; Client Components need plain objects. */
function plainClass(row: ClassRow): ClassRow {
  return { id: row.id, label: row.label };
}

export function listClasses(): ClassRow[] {
  const rows = getDb()
    .prepare(`SELECT id, label FROM classes WHERE active = 1 ORDER BY sort_order, id`)
    .all() as ClassRow[];
  return rows.map(plainClass);
}

export function classExists(id: string): boolean {
  const row = getDb()
    .prepare(`SELECT 1 AS ok FROM classes WHERE id = ? AND active = 1`)
    .get(id) as { ok: number } | undefined;
  return Boolean(row);
}
