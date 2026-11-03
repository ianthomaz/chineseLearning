/**
 * Transactional email through Resend's REST API (no SDK needed).
 *
 * Env: RESEND_API_KEY, RESEND_FROM (e.g. `LearnChinese Today <no-reply@learnchinese.today>`;
 * the domain must be verified in Resend). Without a key — local dev — the
 * message is printed to the server log instead, so the links can be clicked.
 */
import { emailTemplate, type EmailKind, type EmailLocale } from "./templates";

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "LearnChinese Today <no-reply@learnchinese.today>";

export type SendResult = { ok: true; id?: string; logged?: boolean } | { ok: false; error: string };

export async function sendTransactionalEmail(input: {
  to: string;
  kind: EmailKind;
  locale: EmailLocale;
  link: string;
}): Promise<SendResult> {
  const { subject, text, html } = emailTemplate(input.kind, input.locale, input.link);
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.info(`[email] RESEND_API_KEY not set — would send "${subject}" to ${input.to}: ${input.link}`);
    return { ok: true, logged: true };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: [input.to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[email] Resend ${res.status}: ${body.slice(0, 300)}`);
      return { ok: false, error: `resend_${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    console.warn("[email] Resend request failed", err);
    return { ok: false, error: "network" };
  }
}

/** Public origin for links in emails. */
export function publicOrigin(req: Request): string {
  const configured = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  const origin = configured ? configured.replace(/\/$/, "") : new URL(req.url).origin;
  const base = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
  return origin.endsWith(base) ? origin : `${origin}${base}`;
}
