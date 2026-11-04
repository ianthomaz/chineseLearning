/**
 * Identity (server-only): one user, many ways in. See docs/05_autenticacao.md § Contas.
 *
 * - `accounts` maps (provider, provider_account_id) → `users.id`.
 *   Providers: 'google', 'apple', 'alipay' (id = open_id), 'email'
 *   (id = normalised email). Alipay has no email, so it never joins another account.
 * - `users.clearance` is a NOIA UC (`server/auth/noia.ts`): O1 while an email
 *   account waits for its confirmation link, O4 once released. Every change is
 *   audited in `clearance_changes`.
 * - Accounts join by **verified** email only: a Google user who later registers
 *   the same address with a password ends up as one user, and so does the
 *   reverse. Apple's "Hide My Email" addresses simply never match.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDb } from "./index";
import { CLEARANCE, isReleased } from "@/server/auth/noia";
import { normalizeEmail } from "@/lib/email-check";

export type Provider = "google" | "apple" | "alipay" | "email";

export type IdentityUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  nick: string | null;
  clearance: string;
  passwordHash: string | null;
  emailVerifiedAt: string | null;
};

const USER_COLUMNS = `id, email, name, image, nick, clearance,
  password_hash AS passwordHash, email_verified_at AS emailVerifiedAt`;

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function newUserId(): string {
  return `u_${randomUUID().replace(/-/g, "")}`;
}

function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function getIdentityUser(userId: string): IdentityUser | null {
  const row = getDb()
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`)
    .get(userId) as IdentityUser | undefined;
  return row ?? null;
}

export function providersOf(userId: string): Provider[] {
  const rows = getDb()
    .prepare(`SELECT provider FROM accounts WHERE user_id = ? ORDER BY created_at`)
    .all(userId) as { provider: Provider }[];
  return rows.map((r) => r.provider);
}

function userIdForAccount(provider: Provider, providerAccountId: string): string | null {
  const row = getDb()
    .prepare(`SELECT user_id AS userId FROM accounts WHERE provider = ? AND provider_account_id = ?`)
    .get(provider, providerAccountId) as { userId: string } | undefined;
  return row?.userId ?? null;
}

/** A released user whose verified email is this address — the join point. */
function releasedUserByEmail(email: string): IdentityUser | null {
  const rows = getDb()
    .prepare(
      `SELECT ${USER_COLUMNS} FROM users
        WHERE lower(email) = ? AND email_verified_at IS NOT NULL
        ORDER BY created_at`,
    )
    .all(email) as IdentityUser[];
  return rows.find((u) => isReleased(u.clearance)) ?? null;
}

/** Pending email+password signup for this address (O1, not yet confirmed). */
function pendingEmailUserByEmail(email: string): IdentityUser | null {
  const userId = userIdForAccount("email", email);
  if (!userId) return null;
  const user = getIdentityUser(userId);
  if (!user || isReleased(user.clearance)) return null;
  return user;
}

function linkAccount(provider: Provider, providerAccountId: string, userId: string, email: string | null) {
  getDb()
    .prepare(
      `INSERT INTO accounts (provider, provider_account_id, user_id, email)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(provider, provider_account_id) DO UPDATE SET user_id = excluded.user_id`,
    )
    .run(provider, providerAccountId, userId, email);
}

export function setClearance(userId: string, toCl: string, source: string): void {
  const db = getDb();
  const current = db.prepare(`SELECT clearance FROM users WHERE id = ?`).get(userId) as
    | { clearance: string }
    | undefined;
  if (!current || current.clearance === toCl) return;
  db.prepare(`UPDATE users SET clearance = ?, updated_at = datetime('now') WHERE id = ?`).run(toCl, userId);
  db.prepare(
    `INSERT INTO clearance_changes (user_id, from_cl, to_cl, source) VALUES (?, ?, ?, ?)`,
  ).run(userId, current.clearance, toCl, source);
}

/** Raise to the released clearance; never lowers an insider/admin. */
function release(userId: string, source: string): void {
  const user = getIdentityUser(userId);
  if (user && !isReleased(user.clearance)) setClearance(userId, CLEARANCE.released, source);
}

// ── Google / Apple ──────────────────────────────────────────────────────────

export type OAuthIdentity = {
  provider: "google" | "apple" | "alipay";
  providerAccountId: string;
  email?: string | null;
  emailVerified?: boolean;
  name?: string | null;
  image?: string | null;
};

/**
 * The user behind a Google, Apple, or Alipay sign-in, created or joined as needed.
 * A provider sign-in releases the account at once (clearance O4).
 * Alipay is joined only by open_id — the token response has no verified email.
 */
export function resolveOAuthUser(identity: OAuthIdentity): string {
  const db = getDb();
  const email = identity.email ? normalizeEmail(identity.email) : null;

  let userId = userIdForAccount(identity.provider, identity.providerAccountId);

  // Users from before `accounts` existed: id = Google sub, no account row yet.
  if (!userId && identity.provider === "google") {
    const legacy = db.prepare(`SELECT id FROM users WHERE id = ?`).get(identity.providerAccountId) as
      | { id: string }
      | undefined;
    if (legacy) userId = legacy.id;
  }
  if (!userId && email && identity.emailVerified) {
    userId = releasedUserByEmail(email)?.id ?? null;
  }
  // Same address waiting on email+password confirm — absorb, do not fork a second user.
  if (!userId && email && identity.emailVerified) {
    userId = pendingEmailUserByEmail(email)?.id ?? null;
  }

  db.exec("BEGIN");
  try {
    if (!userId) {
      userId = newUserId();
      db.prepare(
        `INSERT INTO users (id, email, name, image, clearance, email_verified_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        userId,
        email,
        identity.name ?? null,
        identity.image ?? null,
        CLEARANCE.pending,
        identity.emailVerified ? new Date().toISOString() : null,
      );
    } else {
      db.prepare(
        `UPDATE users SET
           email = COALESCE(email, ?),
           name = COALESCE(?, name),
           image = COALESCE(?, image),
           email_verified_at = CASE WHEN ? THEN COALESCE(email_verified_at, datetime('now')) ELSE email_verified_at END,
           updated_at = datetime('now')
         WHERE id = ?`,
      ).run(email, identity.name ?? null, identity.image ?? null, identity.emailVerified ? 1 : 0, userId);
    }
    linkAccount(identity.provider, identity.providerAccountId, userId, email);
    release(userId, "oauth_signup");
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return userId;
}

// ── Email + password ────────────────────────────────────────────────────────

export type RegisterOutcome =
  | { status: "created"; userId: string }
  | { status: "pending_updated"; userId: string }
  /** Password linked onto an already-released OAuth user — sign-in works now. */
  | { status: "linked_ready"; userId: string }
  | { status: "taken" };

/**
 * New email account (pending, O1). Registering again before confirming just
 * replaces the password and sends a new link — people forget what they typed.
 * An address that already has a confirmed password is taken.
 * A released Google/Apple user with the same verified email gets the password
 * on that user (no second account).
 */
export function registerEmailAccount(emailRaw: string, passwordHash: string): RegisterOutcome {
  const db = getDb();
  const email = normalizeEmail(emailRaw);
  const existingId = userIdForAccount("email", email);

  if (existingId) {
    const existing = getIdentityUser(existingId);
    if (existing && isReleased(existing.clearance) && existing.passwordHash) {
      return { status: "taken" };
    }
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
      passwordHash,
      existingId,
    );
    if (existing && isReleased(existing.clearance)) {
      return { status: "linked_ready", userId: existingId };
    }
    return { status: "pending_updated", userId: existingId };
  }

  const owner = releasedUserByEmail(email);
  if (owner) {
    db.exec("BEGIN");
    try {
      db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
        passwordHash,
        owner.id,
      );
      linkAccount("email", email, owner.id, email);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    return { status: "linked_ready", userId: owner.id };
  }

  const userId = newUserId();
  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO users (id, email, clearance, password_hash) VALUES (?, ?, ?, ?)`,
    ).run(userId, email, CLEARANCE.pending, passwordHash);
    db.prepare(
      `INSERT INTO clearance_changes (user_id, from_cl, to_cl, source) VALUES (?, NULL, ?, 'signup')`,
    ).run(userId, CLEARANCE.pending);
    linkAccount("email", email, userId, email);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return { status: "created", userId };
}

/** The user an email+password sign-in refers to, if any. */
export function userForEmailLogin(emailRaw: string): IdentityUser | null {
  const userId = userIdForAccount("email", normalizeEmail(emailRaw));
  return userId ? getIdentityUser(userId) : null;
}

/**
 * The confirmation link was opened: release the account. If the address
 * already belongs to a released user (e.g. signed up with Google before), the
 * password moves onto that user and the pending one is dropped — one person,
 * one progress history. Returns the surviving user id.
 */
export function confirmEmail(userId: string, emailRaw: string): string {
  const db = getDb();
  const email = normalizeEmail(emailRaw);
  const pending = getIdentityUser(userId);
  if (!pending) return userId;

  const owner = releasedUserByEmail(email);
  db.exec("BEGIN");
  try {
    if (owner && owner.id !== userId) {
      db.prepare(
        `UPDATE users SET password_hash = COALESCE(?, password_hash), updated_at = datetime('now') WHERE id = ?`,
      ).run(pending.passwordHash, owner.id);
      linkAccount("email", email, owner.id, email);
      deleteUserRows(pending.id);
      db.exec("COMMIT");
      return owner.id;
    }
    db.prepare(
      `UPDATE users SET email_verified_at = COALESCE(email_verified_at, datetime('now')), updated_at = datetime('now') WHERE id = ?`,
    ).run(userId);
    release(userId, "email_verified");
    db.exec("COMMIT");
    return userId;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Who a "forgot password" request is for. Prefer a released (verified) user so
 * a pending email clone never steals the reset from Google/Apple.
 */
export function userForPasswordReset(emailRaw: string): IdentityUser | null {
  const email = normalizeEmail(emailRaw);
  const released = releasedUserByEmail(email);
  if (released) return released;
  const emailUser = userForEmailLogin(email);
  if (emailUser && isReleased(emailUser.clearance)) return emailUser;
  return emailUser;
}

/** Reset link used: new password, ensure the email account row, release. */
export function applyPasswordReset(userId: string, emailRaw: string, passwordHash: string): void {
  const db = getDb();
  const email = normalizeEmail(emailRaw);
  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, datetime('now')),
         updated_at = datetime('now') WHERE id = ?`,
    ).run(passwordHash, userId);
    linkAccount("email", email, userId, email);
    release(userId, "password_reset");
    // Drop leftover O1 clones for the same address (pre-merge race / old bugs).
    dropPendingEmailClones(email, userId);
    // A reset means the old password may be known to someone else.
    db.prepare(`DELETE FROM app_sessions WHERE user_id = ?`).run(userId);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/** Remove unreleased users that share this email but are not `keepUserId`. */
function dropPendingEmailClones(email: string, keepUserId: string): void {
  const rows = getDb()
    .prepare(
      `SELECT id, clearance FROM users WHERE lower(email) = ? AND id != ?`,
    )
    .all(email, keepUserId) as { id: string; clearance: string }[];
  for (const row of rows) {
    if (!isReleased(row.clearance)) deleteUserRows(row.id);
  }
}

// ── One-time email links ────────────────────────────────────────────────────

export type EmailTokenPurpose = "verify" | "reset";

const TOKEN_TTL_HOURS: Record<EmailTokenPurpose, number> = { verify: 72, reset: 2 };

export function createEmailToken(userId: string, emailRaw: string, purpose: EmailTokenPurpose): string {
  const raw = newSecret();
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS[purpose] * 3600_000).toISOString();
  getDb()
    .prepare(
      `INSERT INTO email_tokens (token_hash, user_id, email, purpose, expires_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(sha256(raw), userId, normalizeEmail(emailRaw), purpose, expires);
  return raw;
}

export type EmailTokenRow = { userId: string; email: string; expiresAt: string; usedAt: string | null };

/**
 * Looks a link up. Verify links stay valid until they expire (mail scanners
 * open links too; a second click must not fail); reset links work once.
 */
export function readEmailToken(
  raw: string,
  purpose: EmailTokenPurpose,
): { ok: true; row: EmailTokenRow } | { ok: false; reason: "invalid" | "expired" | "used" } {
  if (typeof raw !== "string" || raw.length < 20 || raw.length > 200) return { ok: false, reason: "invalid" };
  const row = getDb()
    .prepare(
      `SELECT user_id AS userId, email, expires_at AS expiresAt, used_at AS usedAt
         FROM email_tokens WHERE token_hash = ? AND purpose = ?`,
    )
    .get(sha256(raw), purpose) as EmailTokenRow | undefined;
  if (!row) return { ok: false, reason: "invalid" };
  if (Date.parse(row.expiresAt) < Date.now()) return { ok: false, reason: "expired" };
  if (purpose === "reset" && row.usedAt) return { ok: false, reason: "used" };
  return { ok: true, row };
}

export function markEmailTokenUsed(raw: string): void {
  getDb()
    .prepare(`UPDATE email_tokens SET used_at = COALESCE(used_at, datetime('now')) WHERE token_hash = ?`)
    .run(sha256(raw));
}

// ── App sessions (iOS bearer tokens) ────────────────────────────────────────

const APP_SESSION_DAYS = 180;
/** Sessions used within this window of expiry are extended. */
const APP_SESSION_RENEW_DAYS = 30;

export function createAppSession(userId: string, client: string | null): string {
  const raw = newSecret();
  const expires = new Date(Date.now() + APP_SESSION_DAYS * 86400_000).toISOString();
  getDb()
    .prepare(`INSERT INTO app_sessions (token_hash, user_id, client, expires_at) VALUES (?, ?, ?, ?)`)
    .run(sha256(raw), userId, client ? client.slice(0, 80) : null, expires);
  return raw;
}

export function userIdForAppToken(raw: string): string | null {
  if (!raw || raw.length > 200) return null;
  const db = getDb();
  const hash = sha256(raw);
  const row = db
    .prepare(`SELECT user_id AS userId, expires_at AS expiresAt FROM app_sessions WHERE token_hash = ?`)
    .get(hash) as { userId: string; expiresAt: string } | undefined;
  if (!row) return null;
  const expiresAt = Date.parse(row.expiresAt);
  if (expiresAt < Date.now()) {
    db.prepare(`DELETE FROM app_sessions WHERE token_hash = ?`).run(hash);
    return null;
  }
  const renew = expiresAt - Date.now() < APP_SESSION_RENEW_DAYS * 86400_000;
  db.prepare(
    `UPDATE app_sessions SET last_used_at = datetime('now')${renew ? ", expires_at = ?" : ""} WHERE token_hash = ?`,
  ).run(...(renew ? [new Date(Date.now() + APP_SESSION_DAYS * 86400_000).toISOString(), hash] : [hash]));
  return row.userId;
}

export function revokeAppSession(raw: string): void {
  getDb().prepare(`DELETE FROM app_sessions WHERE token_hash = ?`).run(sha256(raw));
}

// ── Deletion ────────────────────────────────────────────────────────────────

/** Rows owned by a user. Telemetry in `events` is kept but anonymised. */
function deleteUserRows(userId: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM progress WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM game_rounds WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM accounts WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM app_sessions WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM email_tokens WHERE user_id = ?`).run(userId);
  db.prepare(`UPDATE events SET user_id = NULL WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
}

/** "Delete my account" (required by the App Store for apps with sign-up). */
export function deleteAccount(userId: string): void {
  const db = getDb();
  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO clearance_changes (user_id, from_cl, to_cl, source)
       SELECT id, clearance, 'N0', 'account_deleted' FROM users WHERE id = ?`,
    ).run(userId);
    deleteUserRows(userId);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
