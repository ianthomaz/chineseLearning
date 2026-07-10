/** Site user records (server-only). Google `sub` is the primary key. */
import { getDb } from "./index";

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  nick: string | null;
};

export type UserInput = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

/** Insert or update profile fields (called on sign-in). */
export function upsertUser(input: UserInput): void {
  getDb()
    .prepare(
      `INSERT INTO users (id, email, name, image)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         image = excluded.image,
         updated_at = datetime('now')`,
    )
    .run(input.id, input.email ?? null, input.name ?? null, input.image ?? null);
}

export function setNick(userId: string, nick: string): void {
  getDb()
    .prepare(`UPDATE users SET nick = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(nick, userId);
}

export function getUser(userId: string): User | null {
  const row = getDb()
    .prepare(`SELECT id, email, name, image, nick FROM users WHERE id = ?`)
    .get(userId) as User | undefined;
  return row ?? null;
}
