/** Class (turma) config rows, seeded in the MIGRATION (server-only). */
import { getDb } from "./index";

export type ClassRow = {
  id: string;
  label: string;
};

export function listClasses(): ClassRow[] {
  return getDb()
    .prepare(`SELECT id, label FROM classes WHERE active = 1 ORDER BY sort_order, id`)
    .all() as ClassRow[];
}

export function classExists(id: string): boolean {
  const row = getDb()
    .prepare(`SELECT 1 AS ok FROM classes WHERE id = ? AND active = 1`)
    .get(id) as { ok: number } | undefined;
  return Boolean(row);
}
