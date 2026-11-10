/**
 * Observer API regression test (local only).
 *
 *   cd web && npx tsx scripts/test-observer.mjs
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const dir = mkdtempSync(join(tmpdir(), "lc-observer-"));
const dbFile = join(dir, "test.sqlite");
process.env.SITE_DB = dbFile;

const TEST_KEY = "test-secret-observer-key-12345";
process.env.OBSERVER_API_KEY = TEST_KEY;

async function run() {
  const { getDb } = await import(pathToFileURL(join(process.cwd(), "src/server/db/index.ts")).href);
  const { GET } = await import(pathToFileURL(join(process.cwd(), "src/app/api/observer/route.server.ts")).href);

  const db = getDb();

  // Seed sample rows
  db.prepare(`
    INSERT INTO users (id, email, name, nick, password_hash, clearance)
    VALUES ('u_test1', 'test@example.com', 'Test User', 'Tester', 'secret_hash_value', 'O4')
  `).run();

  db.prepare(`
    INSERT INTO app_sessions (token_hash, user_id, client, expires_at)
    VALUES ('abcdef1234567890abcdef1234567890', 'u_test1', 'ios', datetime('now', '+30 days'))
  `).run();

  db.prepare(`
    INSERT INTO events (event, user_id, round_id, tier, level, correct)
    VALUES ('round_start', 'u_test1', 'r1', 'hsk1', 1, NULL),
           ('phrase_result', 'u_test1', 'r1', 'hsk1', 1, 1),
           ('round_abandon', 'u_test1', 'r1', 'hsk1', 1, NULL)
  `).run();

  // Test 1: 503 if no key configured
  delete process.env.OBSERVER_API_KEY;
  delete process.env.OBSERVER_TOKEN;
  let req = new Request("http://localhost/api/observer");
  let res = await GET(req);
  assert.equal(res.status, 503);
  let body = await res.json();
  assert.equal(body.error, "observer_disabled");

  // Restore key
  process.env.OBSERVER_API_KEY = TEST_KEY;

  // Test 2: 401 on missing key
  req = new Request("http://localhost/api/observer");
  res = await GET(req);
  assert.equal(res.status, 401);

  // Test 3: 401 on wrong key
  req = new Request("http://localhost/api/observer", {
    headers: { Authorization: "Bearer wrong-key" },
  });
  res = await GET(req);
  assert.equal(res.status, 401);

  // Test 4: 200 with Authorization: Bearer
  req = new Request("http://localhost/api/observer", {
    headers: { Authorization: `Bearer ${TEST_KEY}` },
  });
  res = await GET(req);
  assert.equal(res.status, 200);
  body = await res.json();
  assert.equal(body.status, "ok");
  assert.equal(body.database.tables.users, 1);
  assert.equal(body.database.tables.events, 3);
  assert.equal(body.weeklySummary.roundsAbandoned, 1);
  assert.equal(body.recentErrors.length, 1);
  assert.equal(body.recentErrors[0].event, "round_abandon");

  // Test 5: 200 with x-observer-key header
  req = new Request("http://localhost/api/observer", {
    headers: { "x-observer-key": TEST_KEY },
  });
  res = await GET(req);
  assert.equal(res.status, 200);

  // Test 6: Table inspection - users table (sanitized)
  req = new Request("http://localhost/api/observer?view=table&name=users", {
    headers: { Authorization: `Bearer ${TEST_KEY}` },
  });
  res = await GET(req);
  assert.equal(res.status, 200);
  body = await res.json();
  assert.equal(body.table, "users");
  assert.equal(body.total, 1);
  assert.equal(body.rows[0].id, "u_test1");
  assert.equal(body.rows[0].email, "test@example.com");
  assert.equal(body.rows[0].released, true);
  assert.equal(body.rows[0].password_hash, undefined, "password_hash must be omitted!");
  assert.equal(body.rows[0].clearance, undefined, "raw clearance must be omitted!");

  // Test 7: Table inspection - app_sessions table (sanitized)
  req = new Request("http://localhost/api/observer?view=table&name=app_sessions", {
    headers: { Authorization: `Bearer ${TEST_KEY}` },
  });
  res = await GET(req);
  assert.equal(res.status, 200);
  body = await res.json();
  assert.equal(body.table, "app_sessions");
  assert.equal(body.rows[0].user_id, "u_test1");
  assert.equal(body.rows[0].token_hash, undefined, "token_hash must be omitted!");
  assert.equal(body.rows[0].token_prefix, "abcdef12...");

  // Test 8: Disallowed table
  req = new Request("http://localhost/api/observer?view=table&name=sqlite_master", {
    headers: { Authorization: `Bearer ${TEST_KEY}` },
  });
  res = await GET(req);
  assert.equal(res.status, 400);
  body = await res.json();
  assert.equal(body.error, "table_not_allowed");

  console.log("All observer tests passed!");
}

try {
  await run();
} finally {
  rmSync(dir, { recursive: true, force: true });
}
