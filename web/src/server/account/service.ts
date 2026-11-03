/**
 * Account flows shared by the site and the iOS app: email sign-up with a
 * confirmation link, password sign-in, password reset, and the account payload.
 * Route handlers stay thin; everything here returns codes, never throws for
 * user mistakes. Error codes are the i18n keys `account.error.<code>`.
 */
import { resolveMx, resolve4, resolve6 } from "node:dns/promises";
import { isPlausibleEmail, normalizeEmail } from "@/lib/email-check";
import { isReleased } from "@/server/auth/noia";
import { hashPassword, isAcceptablePassword, verifyPassword } from "@/server/auth/password";
import {
  applyPasswordReset,
  confirmEmail,
  createEmailToken,
  getIdentityUser,
  markEmailTokenUsed,
  providersOf,
  readEmailToken,
  registerEmailAccount,
  userForEmailLogin,
  userForPasswordReset,
  type IdentityUser,
} from "@/server/db/identity";
import { sendTransactionalEmail } from "@/server/email/resend";
import { emailLocale } from "@/server/email/templates";

export type AccountError =
  | "invalid_email"
  | "email_mismatch"
  | "email_domain"
  | "weak_password"
  | "email_taken"
  | "invalid_credentials"
  | "email_not_verified"
  | "invalid_token"
  | "expired_token"
  | "email_failed"
  | "rate_limited";

export type AccountPayload = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  nick: string | null;
  /** NOIA UC, e.g. "O4". */
  clearance: string;
  released: boolean;
  providers: string[];
  hasPassword: boolean;
};

export function accountPayload(userId: string): AccountPayload | null {
  const user = getIdentityUser(userId);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    nick: user.nick,
    clearance: user.clearance,
    released: isReleased(user.clearance),
    providers: providersOf(user.id),
    hasPassword: Boolean(user.passwordHash),
  };
}

const DNS_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("dns_timeout")), DNS_TIMEOUT_MS)),
  ]);
}

/**
 * Does the domain exist and can it receive mail (MX, or an address record as
 * the implicit MX)? Only a definite "no such domain" fails; a DNS hiccup must
 * never block a sign-up.
 */
export async function domainReceivesMail(domain: string): Promise<boolean> {
  const missing = (err: unknown) =>
    err instanceof Error && "code" in err && ["ENOTFOUND", "ENODATA"].includes(String((err as { code: unknown }).code));
  try {
    const mx = await withTimeout(resolveMx(domain));
    if (mx.length > 0) return true;
  } catch (err) {
    if (!missing(err)) return true;
  }
  for (const lookup of [resolve4, resolve6]) {
    try {
      const addresses = await withTimeout(lookup(domain));
      if (addresses.length > 0) return true;
    } catch (err) {
      if (!missing(err)) return true;
    }
  }
  return false;
}

async function sendLink(
  kind: "verify" | "reset",
  user: IdentityUser,
  email: string,
  locale: string,
  origin: string,
): Promise<boolean> {
  const token = createEmailToken(user.id, email, kind);
  const path = kind === "verify" ? "/account/verify" : "/account/reset-password";
  const link = `${origin}${path}?token=${encodeURIComponent(token)}`;
  const sent = await sendTransactionalEmail({ to: email, kind, locale: emailLocale(locale), link });
  return sent.ok;
}

export async function registerAccount(
  input: { email?: unknown; emailConfirm?: unknown; password?: unknown; locale?: unknown },
  origin: string,
): Promise<{ ok: true } | { ok: false; error: AccountError }> {
  const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
  const confirm = typeof input.emailConfirm === "string" ? normalizeEmail(input.emailConfirm) : "";
  if (!isPlausibleEmail(email)) return { ok: false, error: "invalid_email" };
  if (email !== confirm) return { ok: false, error: "email_mismatch" };
  if (!isAcceptablePassword(input.password)) return { ok: false, error: "weak_password" };
  if (!(await domainReceivesMail(email.slice(email.lastIndexOf("@") + 1)))) {
    return { ok: false, error: "email_domain" };
  }

  const outcome = registerEmailAccount(email, await hashPassword(input.password));
  if (outcome.status === "taken") return { ok: false, error: "email_taken" };

  const user = getIdentityUser(outcome.userId);
  if (!user) return { ok: false, error: "email_failed" };
  const sent = await sendLink("verify", user, email, String(input.locale ?? "en"), origin);
  return sent ? { ok: true } : { ok: false, error: "email_failed" };
}

/** Sends a fresh confirmation link to a pending account. Silent otherwise. */
export async function resendVerification(emailRaw: unknown, locale: unknown, origin: string): Promise<void> {
  if (typeof emailRaw !== "string" || !isPlausibleEmail(emailRaw)) return;
  const email = normalizeEmail(emailRaw);
  const user = userForEmailLogin(email);
  if (!user || isReleased(user.clearance)) return;
  await sendLink("verify", user, email, String(locale ?? "en"), origin);
}

export async function passwordSignIn(
  emailRaw: unknown,
  password: unknown,
): Promise<{ ok: true; userId: string } | { ok: false; error: AccountError }> {
  if (typeof emailRaw !== "string" || typeof password !== "string") {
    return { ok: false, error: "invalid_credentials" };
  }
  const user = userForEmailLogin(emailRaw);
  // Same work whether or not the user exists, so timing does not tell.
  const valid = await verifyPassword(password, user?.passwordHash ?? "scrypt$16384$8$1$AAAA$AAAA");
  if (!user || !valid) return { ok: false, error: "invalid_credentials" };
  if (!isReleased(user.clearance)) return { ok: false, error: "email_not_verified" };
  return { ok: true, userId: user.id };
}

export function confirmEmailToken(
  token: unknown,
): { ok: true; userId: string } | { ok: false; error: AccountError } {
  const read = readEmailToken(String(token ?? ""), "verify");
  if (!read.ok) return { ok: false, error: read.reason === "expired" ? "expired_token" : "invalid_token" };
  const userId = confirmEmail(read.row.userId, read.row.email);
  markEmailTokenUsed(String(token));
  return { ok: true, userId };
}

/** Always "ok" to the caller — whether an account exists is not disclosed. */
export async function requestPasswordReset(emailRaw: unknown, locale: unknown, origin: string): Promise<void> {
  if (typeof emailRaw !== "string" || !isPlausibleEmail(emailRaw)) return;
  const email = normalizeEmail(emailRaw);
  const user = userForPasswordReset(email);
  if (!user) return;
  await sendLink("reset", user, email, String(locale ?? "en"), origin);
}

export async function resetPassword(
  token: unknown,
  password: unknown,
): Promise<{ ok: true } | { ok: false; error: AccountError }> {
  if (!isAcceptablePassword(password)) return { ok: false, error: "weak_password" };
  const raw = String(token ?? "");
  const read = readEmailToken(raw, "reset");
  if (!read.ok) return { ok: false, error: read.reason === "expired" ? "expired_token" : "invalid_token" };
  applyPasswordReset(read.row.userId, read.row.email, await hashPassword(password));
  markEmailTokenUsed(raw);
  return { ok: true };
}
