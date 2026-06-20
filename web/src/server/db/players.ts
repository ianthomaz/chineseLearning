/** Player records (server-only). Nick is cosmetic for now; ranking comes later. */
import { getDb } from "./index";

export type Player = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  nick: string | null;
};

export type PlayerInput = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

/** Insert or update the player's Google profile fields (called on sign-in). */
export function upsertPlayer(input: PlayerInput): void {
  getDb()
    .prepare(
      `INSERT INTO players (id, email, name, image)
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
    .prepare(`UPDATE players SET nick = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(nick, userId);
}

export function getPlayer(userId: string): Player | null {
  const row = getDb()
    .prepare(`SELECT id, email, name, image, nick FROM players WHERE id = ?`)
    .get(userId) as Player | undefined;
  return row ?? null;
}
