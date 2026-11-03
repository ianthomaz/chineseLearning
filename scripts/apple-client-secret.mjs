#!/usr/bin/env node
/**
 * Sign in with Apple on the SITE needs a client secret: a JWT signed with the
 * team's .p8 key, valid for at most 6 months. This prints one — paste it into
 * credentials.json → apple.AUTH_APPLE_SECRET, then run sync-env-from-credentials.
 * (The iOS app does not need it.) Renew before it expires.
 *
 * Reads credentials.json → apple.{AUTH_APPLE_ID, team_id, key_id, private_key_file}.
 * Usage (repo root): node scripts/apple-client-secret.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, "web", "package.json"));
const { SignJWT, importPKCS8 } = require("jose");

const SIX_MONTHS_S = 180 * 24 * 60 * 60;

const data = JSON.parse(readFileSync(join(ROOT, "local", "credentials", "credentials.json"), "utf8"));
const apple = data.apple ?? {};
for (const key of ["AUTH_APPLE_ID", "team_id", "key_id", "private_key_file"]) {
  if (!apple[key]) {
    console.error(`[apple-client-secret] credentials.json → apple.${key} is empty`);
    process.exit(1);
  }
}

const pem = readFileSync(join(ROOT, apple.private_key_file), "utf8");
const key = await importPKCS8(pem, "ES256");
const now = Math.floor(Date.now() / 1000);
const secret = await new SignJWT({})
  .setProtectedHeader({ alg: "ES256", kid: apple.key_id })
  .setIssuer(apple.team_id)
  .setSubject(apple.AUTH_APPLE_ID)
  .setAudience("https://appleid.apple.com")
  .setIssuedAt(now)
  .setExpirationTime(now + SIX_MONTHS_S)
  .sign(key);

console.log(secret);
console.error(`[apple-client-secret] valid until ${new Date((now + SIX_MONTHS_S) * 1000).toISOString().slice(0, 10)}`);
