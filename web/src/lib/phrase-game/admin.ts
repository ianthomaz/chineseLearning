/**
 * Admin allow-list for the phrase-game dashboard.
 *
 * Public on purpose (`NEXT_PUBLIC_*`): it only decides who SEES the dashboard
 * button and gates the page render. Real access still requires being signed in
 * AS that Google account — the session email is verified server-side.
 *
 * Comma-separated; defaults to the repo owner when unset.
 */
const RAW = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "ianthomaz@gmail.com";

export const ADMIN_EMAILS: string[] = RAW.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && ADMIN_EMAILS.includes(email.toLowerCase());
}
