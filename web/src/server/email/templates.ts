/** Transactional email copy — English base, pt-BR and es translations. */

export type EmailKind = "verify" | "reset" | "link";
export type EmailLocale = "en" | "pt" | "es";

type Copy = { subject: string; heading: string; body: string; button: string; footer: string };

const COPY: Record<EmailKind, Record<EmailLocale, Copy>> = {
  verify: {
    en: {
      subject: "Confirm your email — LearnChinese Today",
      heading: "Confirm your email",
      body: "Open the link below to confirm this address and activate your account.",
      button: "Confirm email",
      footer: "If you did not create an account, you can ignore this email. The link expires in 3 days.",
    },
    pt: {
      subject: "Confirme seu e-mail — LearnChinese Today",
      heading: "Confirme seu e-mail",
      body: "Abra o link abaixo para confirmar este endereço e ativar sua conta.",
      button: "Confirmar e-mail",
      footer: "Se você não criou uma conta, ignore este e-mail. O link vale por 3 dias.",
    },
    es: {
      subject: "Confirma tu correo — LearnChinese Today",
      heading: "Confirma tu correo",
      body: "Abre el enlace de abajo para confirmar esta dirección y activar tu cuenta.",
      button: "Confirmar correo",
      footer: "Si no creaste una cuenta, ignora este correo. El enlace vale 3 días.",
    },
  },
  reset: {
    en: {
      subject: "Set a new password — LearnChinese Today",
      heading: "Set a new password",
      body: "Open the link below to choose a new password.",
      button: "Choose password",
      footer: "If you did not ask for this, ignore this email. The link expires in 2 hours.",
    },
    pt: {
      subject: "Defina uma nova senha — LearnChinese Today",
      heading: "Defina uma nova senha",
      body: "Abra o link abaixo para escolher uma nova senha.",
      button: "Escolher senha",
      footer: "Se você não pediu isso, ignore este e-mail. O link vale por 2 horas.",
    },
    es: {
      subject: "Elige una nueva contraseña — LearnChinese Today",
      heading: "Elige una nueva contraseña",
      body: "Abre el enlace de abajo para elegir una nueva contraseña.",
      button: "Elegir contraseña",
      footer: "Si no lo pediste, ignora este correo. El enlace vale 2 horas.",
    },
  },
  link: {
    en: {
      subject: "Link your account — LearnChinese Today",
      heading: "Link your account",
      body: "A request was made to link your login with your LearnChinese Today account. Open the link below to confirm and unify your progress.",
      button: "Link account",
      footer: "If you did not request this, you can safely ignore this email. Your account remains unchanged. The link expires in 2 hours.",
    },
    pt: {
      subject: "Vincule sua conta — LearnChinese Today",
      heading: "Vincule sua conta",
      body: "Uma solicitação foi feita para vincular seu login à sua conta no LearnChinese Today. Abra o link abaixo para confirmar e unificar seu progresso.",
      button: "Vincular conta",
      footer: "Se você não pediu essa vinculação, pode ignorar este e-mail. Sua conta permanecerá inalterada. O link vale por 2 horas.",
    },
    es: {
      subject: "Vincula tu cuenta — LearnChinese Today",
      heading: "Vincula tu cuenta",
      body: "Se solicitó vincular tu inicio de sesión con tu cuenta de LearnChinese Today. Abre el enlace de abajo para confirmar y unificar tu progreso.",
      button: "Vincular cuenta",
      footer: "Si no solicitaste esta vinculación, puedes ignorar este correo. Tu cuenta permanecerá sin cambios. El enlace vale 2 horas.",
    },
  },
};

export function emailLocale(raw: unknown): EmailLocale {
  const value = typeof raw === "string" ? raw.toLowerCase() : "";
  if (value.startsWith("pt")) return "pt";
  if (value.startsWith("es")) return "es";
  return "en";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function emailTemplate(kind: EmailKind, locale: EmailLocale, link: string) {
  const c = COPY[kind][locale];
  const href = escapeHtml(link);
  const text = `${c.heading}\n\n${c.body}\n\n${link}\n\n${c.footer}\n`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f5f2;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1d1d1f">
<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
<tr><td>
<p style="margin:0 0 4px;font-size:13px;color:#86868b">LearnChinese Today · 学中文</p>
<h1 style="margin:0 0 12px;font-size:22px">${escapeHtml(c.heading)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5">${escapeHtml(c.body)}</p>
<p style="margin:0 0 20px"><a href="${href}" style="display:inline-block;background:#d44033;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${escapeHtml(c.button)}</a></p>
<p style="margin:0 0 8px;font-size:12px;color:#86868b;word-break:break-all">${href}</p>
<p style="margin:0;font-size:12px;color:#86868b">${escapeHtml(c.footer)}</p>
</td></tr></table></body></html>`;
  return { subject: c.subject, text, html };
}
