/**
 * Account linking and merging regression test (local only).
 *
 *   cd web && npx tsx scripts/test-account-link.mjs
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const dir = mkdtempSync(join(tmpdir(), "lc-acclink-"));
const dbFile = join(dir, "test.sqlite");
process.env.SITE_DB = dbFile;

async function run() {
  const { getDb } = await import(pathToFileURL(join(process.cwd(), "src/server/db/index.ts")).href);
  const {
    createEmailToken,
    confirmAccountLink,
    readEmailToken,
    getIdentityUser,
    providersOf,
  } = await import(pathToFileURL(join(process.cwd(), "src/server/db/identity.ts")).href);

  const db = getDb();

  // ── Scenario 1: Alipay user links to a brand new email ────────────────────
  console.log("Scenario 1: Linking Alipay account to a new email...");

  db.prepare(`
    INSERT INTO users (id, email, name, nick, clearance, email_verified_at)
    VALUES ('u_alipay_1', NULL, 'Alipay Player', 'AliPlay', 'O4', NULL)
  `).run();

  db.prepare(`
    INSERT INTO accounts (provider, provider_account_id, user_id, email)
    VALUES ('alipay', 'union_ali_1', 'u_alipay_1', NULL)
  `).run();

  const token1 = createEmailToken("u_alipay_1", "fresh@example.com", "link");
  const res1 = confirmAccountLink(token1);

  assert.equal(res1.ok, true);
  assert.equal(res1.userId, "u_alipay_1");
  assert.equal(res1.mergedWithExisting, false);

  const user1 = getIdentityUser("u_alipay_1");
  assert.equal(user1.email, "fresh@example.com");
  assert.notEqual(user1.emailVerifiedAt, null);

  const providers1 = providersOf("u_alipay_1");
  assert.deepEqual(providers1.sort(), ["alipay", "email"].sort());

  // Replay check
  const replay1 = confirmAccountLink(token1);
  assert.equal(replay1.ok, false);
  assert.equal(replay1.reason, "used");

  // ── Scenario 2: Alipay user links to an EXISTING Google user ───────────────
  console.log("Scenario 2: Linking Alipay account to an existing Google user...");

  db.prepare(`
    INSERT INTO users (id, email, name, nick, clearance, email_verified_at)
    VALUES ('u_google_owner', 'student@example.com', 'Google Student', 'Stud', 'O4', '2026-11-01 10:00:00')
  `).run();

  db.prepare(`
    INSERT INTO accounts (provider, provider_account_id, user_id, email)
    VALUES ('google', 'google_sub_123', 'u_google_owner', 'student@example.com')
  `).run();

  // Existing Google owner progress & rounds
  db.prepare(`
    INSERT INTO game_rounds (user_id, game, round_id, total, correct, points)
    VALUES ('u_google_owner', 'phrase', 'r_g1', 10, 10, 100)
  `).run();

  db.prepare(`
    INSERT INTO progress (user_id, game, item_id, attempts, correct, best_score, last_score, last_correct)
    VALUES ('u_google_owner', 'phrase', 'item_1', 2, 2, 10, 10, 1)
  `).run();

  // Temporary Alipay user
  db.prepare(`
    INSERT INTO users (id, email, name, nick, clearance, email_verified_at)
    VALUES ('u_alipay_temp', NULL, 'Mobile Alipay', 'Mobi', 'O4', NULL)
  `).run();

  db.prepare(`
    INSERT INTO accounts (provider, provider_account_id, user_id, email)
    VALUES ('alipay', 'union_ali_mobile_999', 'u_alipay_temp', NULL)
  `).run();

  db.prepare(`
    INSERT INTO alipay_open_ids (app_id, open_id, union_id, user_id)
    VALUES ('app_id_123', 'open_id_456', 'union_ali_mobile_999', 'u_alipay_temp')
  `).run();

  db.prepare(`
    INSERT INTO app_sessions (token_hash, user_id, client, expires_at)
    VALUES ('sess_hash_1', 'u_alipay_temp', 'ios', datetime('now', '+30 days'))
  `).run();

  db.prepare(`
    INSERT INTO game_rounds (user_id, game, round_id, total, correct, points)
    VALUES ('u_alipay_temp', 'phrase', 'r_a1', 10, 8, 80)
  `).run();

  // Progress on temp user: item_1 (overlap) and item_2 (new)
  db.prepare(`
    INSERT INTO progress (user_id, game, item_id, attempts, correct, best_score, last_score, last_correct)
    VALUES ('u_alipay_temp', 'phrase', 'item_1', 1, 1, 8, 8, 1),
           ('u_alipay_temp', 'phrase', 'item_2', 3, 2, 9, 9, 1)
  `).run();

  db.prepare(`
    INSERT INTO events (event, user_id, round_id)
    VALUES ('round_start', 'u_alipay_temp', 'r_a1')
  `).run();

  // Request link to student@example.com
  const token2 = createEmailToken("u_alipay_temp", "student@example.com", "link");
  const res2 = confirmAccountLink(token2);

  assert.equal(res2.ok, true);
  assert.equal(res2.userId, "u_google_owner");
  assert.equal(res2.mergedWithExisting, true);

  // Assert temporary user is gone
  const tempUser = getIdentityUser("u_alipay_temp");
  assert.equal(tempUser, null);

  // Assert surviving owner has both providers
  const providersOwner = providersOf("u_google_owner");
  assert.deepEqual(providersOwner.sort(), ["alipay", "google"].sort());

  // Assert alipay open id points to owner
  const openIdRow = db.prepare(`SELECT user_id FROM alipay_open_ids WHERE open_id = 'open_id_456'`).get();
  assert.equal(openIdRow.user_id, "u_google_owner");

  // Assert app session migrated to owner
  const sessionRow = db.prepare(`SELECT user_id FROM app_sessions WHERE token_hash = 'sess_hash_1'`).get();
  assert.equal(sessionRow.user_id, "u_google_owner");

  // Assert game rounds both point to owner
  const rounds = db.prepare(`SELECT round_id FROM game_rounds WHERE user_id = 'u_google_owner' ORDER BY round_id`).all();
  assert.equal(rounds.length, 2);
  assert.equal(rounds[0].round_id, "r_a1");
  assert.equal(rounds[1].round_id, "r_g1");

  // Assert progress merged correctly
  const progressItem1 = db.prepare(`SELECT attempts, correct FROM progress WHERE user_id = 'u_google_owner' AND item_id = 'item_1'`).get();
  assert.equal(progressItem1.attempts, 3); // 2 + 1
  assert.equal(progressItem1.correct, 3); // 2 + 1

  const progressItem2 = db.prepare(`SELECT attempts, correct FROM progress WHERE user_id = 'u_google_owner' AND item_id = 'item_2'`).get();
  assert.equal(progressItem2.attempts, 3);
  assert.equal(progressItem2.correct, 2);

  // Assert event transferred to owner
  const eventRow = db.prepare(`SELECT user_id FROM events WHERE round_id = 'r_a1'`).get();
  assert.equal(eventRow.user_id, "u_google_owner");

  // ── Scenario 3: Expired link token ────────────────────────────────────────
  console.log("Scenario 3: Expired link token...");

  const token3 = createEmailToken("u_alipay_1", "expired@example.com", "link");
  // Expire token manually in DB
  const { createHash } = await import("node:crypto");
  const hash3 = createHash("sha256").update(token3).digest("hex");
  db.prepare(`UPDATE email_tokens SET expires_at = datetime('now', '-1 hour') WHERE token_hash = ?`).run(hash3);

  const res3 = confirmAccountLink(token3);
  assert.equal(res3.ok, false);
  assert.equal(res3.reason, "expired");

  console.log("All account link tests passed!");
}

try {
  await run();
} finally {
  rmSync(dir, { recursive: true, force: true });
}
