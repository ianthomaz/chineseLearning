/**
 * Identity merge matrix (local only). Uses a temp SQLite file.
 *
 *   cd web && node scripts/test-identity-merge.mjs
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const dir = mkdtempSync(join(tmpdir(), "lc-identity-"));
const dbFile = join(dir, "test.sqlite");
process.env.SITE_DB = dbFile;

async function loadIdentity() {
  // Run via `npm run test:identity` (npx tsx) so .ts imports resolve.
  const mod = await import(
    pathToFileURL(join(process.cwd(), "src/server/db/identity.ts")).href
  );
  const pwd = await import(
    pathToFileURL(join(process.cwd(), "src/server/auth/password.ts")).href
  );
  const db = await import(pathToFileURL(join(process.cwd(), "src/server/db/index.ts")).href);
  return { ...mod, ...pwd, getDb: db.getDb };
}

function clear(getDb) {
  const db = getDb();
  db.exec(`
    DELETE FROM app_sessions;
    DELETE FROM email_tokens;
    DELETE FROM accounts;
    DELETE FROM clearance_changes;
    DELETE FROM progress;
    DELETE FROM game_rounds;
    DELETE FROM users;
  `);
}

function countUsers(getDb) {
  return getDb().prepare(`SELECT COUNT(*) AS n FROM users`).get().n;
}

function providers(getDb, userId) {
  return getDb()
    .prepare(`SELECT provider FROM accounts WHERE user_id = ? ORDER BY provider`)
    .all(userId)
    .map((r) => r.provider);
}

let failed = 0;
function test(name, fn) {
  return { name, fn };
}

async function run() {
  let api;
  try {
    api = await loadIdentity();
  } catch (err) {
    console.error(
      "Could not load TypeScript modules. Install tsx: npm i -D tsx\n",
      err,
    );
    // Retry with node --import tsx by telling the user; try npx path.
    process.exit(1);
  }

  const {
    resolveOAuthUser,
    registerEmailAccount,
    confirmEmail,
    userForPasswordReset,
    applyPasswordReset,
    userForEmailLogin,
    getIdentityUser,
    providersOf,
    hashPassword,
    verifyPassword,
    getDb,
  } = api;

  const cases = [
    test("Google verified → register password → one user, password login OK", async () => {
      clear(getDb);
      const googleId = resolveOAuthUser({
        provider: "google",
        providerAccountId: "g-sub-1",
        email: "merge@example.com",
        emailVerified: true,
        name: "G",
      });
      const hash = await hashPassword("password1");
      const reg = registerEmailAccount("merge@example.com", hash);
      assert.equal(reg.status, "linked_ready");
      assert.equal(reg.userId, googleId);
      assert.equal(countUsers(getDb), 1);
      const user = userForEmailLogin("merge@example.com");
      assert.ok(user);
      assert.equal(user.id, googleId);
      assert.ok(await verifyPassword("password1", user.passwordHash));
      assert.deepEqual(providers(getDb, googleId).sort(), ["email", "google"]);
    }),

    test("Register → verify → Google same email → one user, two providers", async () => {
      clear(getDb);
      const hash = await hashPassword("password1");
      const reg = registerEmailAccount("only@example.com", hash);
      assert.equal(reg.status, "created");
      const surviving = confirmEmail(reg.userId, "only@example.com");
      const googleId = resolveOAuthUser({
        provider: "google",
        providerAccountId: "g-sub-2",
        email: "only@example.com",
        emailVerified: true,
      });
      assert.equal(googleId, surviving);
      assert.equal(countUsers(getDb), 1);
      assert.deepEqual(providersOf(surviving).sort(), ["email", "google"]);
    }),

    test("Google → register → forgot before verify → one user (not two O4)", async () => {
      clear(getDb);
      const googleId = resolveOAuthUser({
        provider: "google",
        providerAccountId: "g-sub-3",
        email: "race@example.com",
        emailVerified: true,
      });
      // Simulate old bug path: force a pending clone, then forgot must prefer Google.
      const hash = await hashPassword("password1");
      // With the fix, register links ready — so invent a clone like the old code did.
      getDb()
        .prepare(
          `INSERT INTO users (id, email, clearance, password_hash) VALUES (?, ?, 'O1', ?)`,
        )
        .run("u_clone_pending", "race@example.com", hash);
      // email account still points at google after linked_ready; for the race case
      // point email at the clone first (old world), then run forgot preference.
      getDb()
        .prepare(
          `INSERT OR REPLACE INTO accounts (provider, provider_account_id, user_id, email)
           VALUES ('email', 'race@example.com', 'u_clone_pending', 'race@example.com')`,
        )
        .run();

      const target = userForPasswordReset("race@example.com");
      assert.ok(target);
      assert.equal(target.id, googleId, "forgot must prefer released Google user");
      const newHash = await hashPassword("password2");
      applyPasswordReset(target.id, "race@example.com", newHash);
      assert.equal(countUsers(getDb), 1);
      assert.equal(getIdentityUser(googleId)?.passwordHash, newHash);
      assert.equal(userForEmailLogin("race@example.com")?.id, googleId);
    }),

    test("Apple Hide My Email does not merge with real address", async () => {
      clear(getDb);
      const real = resolveOAuthUser({
        provider: "google",
        providerAccountId: "g-sub-4",
        email: "real@example.com",
        emailVerified: true,
      });
      const apple = resolveOAuthUser({
        provider: "apple",
        providerAccountId: "a-sub-1",
        email: "hidden@privaterelay.appleid.com",
        emailVerified: true,
      });
      assert.notEqual(real, apple);
      assert.equal(countUsers(getDb), 2);
    }),

    test("Alipay open_id without email is its own user", async () => {
      clear(getDb);
      const googleId = resolveOAuthUser({
        provider: "google",
        providerAccountId: "g-sub-ali",
        email: "ali@example.com",
        emailVerified: true,
      });
      const alipayId = resolveOAuthUser({
        provider: "alipay",
        providerAccountId: "open-id-1",
      });
      assert.notEqual(alipayId, googleId);
      assert.equal(countUsers(getDb), 2);
      const again = resolveOAuthUser({
        provider: "alipay",
        providerAccountId: "open-id-1",
      });
      assert.equal(again, alipayId);
      assert.equal(countUsers(getDb), 2);
      const user = getIdentityUser(alipayId);
      assert.equal(user?.clearance, "O4");
      assert.equal(user?.email, null);
      assert.deepEqual(providersOf(alipayId), ["alipay"]);
    }),

    test("Alipay with same verified email merges onto Google user", async () => {
      clear(getDb);
      const googleId = resolveOAuthUser({
        provider: "google",
        providerAccountId: "g-sub-ali-mail",
        email: "same@example.com",
        emailVerified: true,
        name: "G",
      });
      const alipayId = resolveOAuthUser({
        provider: "alipay",
        providerAccountId: "open-id-mail",
        email: "same@example.com",
        emailVerified: true,
        name: "Ali Nick",
      });
      assert.equal(alipayId, googleId);
      assert.equal(countUsers(getDb), 1);
      assert.deepEqual(providersOf(googleId).sort(), ["alipay", "google"]);
      assert.equal(getIdentityUser(googleId)?.email, "same@example.com");
    }),

    test("OAuth absorbs pending email signup for same verified address", async () => {
      clear(getDb);
      const hash = await hashPassword("password1");
      const reg = registerEmailAccount("absorb@example.com", hash);
      assert.equal(reg.status, "created");
      const oauthId = resolveOAuthUser({
        provider: "google",
        providerAccountId: "g-sub-5",
        email: "absorb@example.com",
        emailVerified: true,
      });
      assert.equal(oauthId, reg.userId);
      assert.equal(countUsers(getDb), 1);
      const user = getIdentityUser(oauthId);
      assert.ok(user?.emailVerifiedAt);
      assert.ok(await verifyPassword("password1", user.passwordHash));
    }),
  ];

  for (const c of cases) {
    try {
      await c.fn();
      console.log(`ok  ${c.name}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${c.name}`);
      console.error(err);
    }
  }

  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  if (failed) {
    console.error(`\n${failed} failed`);
    process.exit(1);
  }
  console.log(`\n${cases.length} passed`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
