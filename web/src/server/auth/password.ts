/**
 * Password hashing with Node's scrypt — no native dependency.
 * Stored as `scrypt$N$r$p$<salt b64>$<hash b64>` so parameters can change later.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

export const PASSWORD_MIN_LENGTH = 8;
/** Long inputs only cost CPU; nobody types 200 characters. */
export const PASSWORD_MAX_LENGTH = 200;

const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 64;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEY_LEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export function isAcceptablePassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored) return false;
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  try {
    const expected = Buffer.from(hashB64, "base64");
    const key = await scrypt(password, Buffer.from(saltB64, "base64"), Number(n), Number(r), Number(p));
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
