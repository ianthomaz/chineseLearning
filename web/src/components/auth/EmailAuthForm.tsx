"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";
import { isPlausibleEmail, normalizeEmail, suggestEmail } from "@/lib/email-check";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PASSWORD_MIN = 8;

type Mode = "signIn" | "register" | "forgot" | "sent" | "forgotSent";

const INPUT_CLASS = "w-full rounded-xl border px-3 py-2.5 text-sm text-ink bg-transparent";
const PRIMARY_CLASS =
  "w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40";
const LINK_CLASS = "text-xs text-ink/55 underline-offset-2 hover:underline";

async function postJson(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; error?: string; needsVerification?: boolean }> {
  try {
    const res = await fetch(`${BASE_PATH}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      needsVerification?: boolean;
    };
    return {
      ok: res.ok && data.ok !== false,
      error: data.error,
      needsVerification: data.needsVerification,
    };
  } catch {
    return { ok: false, error: "generic" };
  }
}

/**
 * Email + password: sign in, create an account (email typed twice, typo hint on
 * the domain, 8+ characters), and "forgot password". Sign-up only sends the
 * confirmation link; the account works once the link is opened.
 */
export function EmailAuthForm({ onSignedIn }: { onSignedIn?: () => void }) {
  const { t, locale } = useLocale();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const suggestion = email.includes("@") ? suggestEmail(email) : null;
  const errorText = (code: string) => {
    const key = `account.error.${code}`;
    const value = t(key);
    return value === key ? t("account.error.generic") : value;
  };

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    const cleanEmail = normalizeEmail(email);

    if (!isPlausibleEmail(cleanEmail)) return setError("invalid_email");
    if (mode === "register" && cleanEmail !== normalizeEmail(emailConfirm)) return setError("email_mismatch");
    if ((mode === "register" || mode === "signIn") && password.length < PASSWORD_MIN) {
      return setError(mode === "register" ? "weak_password" : "invalid_credentials");
    }

    setBusy(true);
    try {
      if (mode === "signIn") {
        trackEvent({ action: "sign_in_start", category: "auth", label: "password" });
        const result = await signIn("password", { email: cleanEmail, password, redirect: false });
        if (result?.error) {
          setError(result.code === "email_not_verified" ? "email_not_verified" : "invalid_credentials");
        } else {
          onSignedIn?.();
        }
      } else if (mode === "register") {
        trackEvent({ action: "sign_up_start", category: "auth", label: "password" });
        const result = await postJson("/api/account/register", {
          email: cleanEmail,
          emailConfirm: normalizeEmail(emailConfirm),
          password,
          locale,
        });
        if (result.ok) {
          setPassword("");
          if (result.needsVerification === false) {
            setNotice(t("account.linkedReady"));
            switchMode("signIn");
          } else {
            switchMode("sent");
          }
        } else {
          setError(result.error ?? "generic");
        }
      } else if (mode === "forgot") {
        await postJson("/api/account/password/forgot", { email: cleanEmail, locale });
        switchMode("forgotSent");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    await postJson("/api/account/resend-verification", { email: normalizeEmail(email), locale });
    setBusy(false);
    setNotice(t("account.resent"));
  }

  if (mode === "sent" || mode === "forgotSent") {
    return (
      <div className="space-y-3 text-left" style={{ fontFamily: "var(--font-sans)" }}>
        {mode === "sent" ? <p className="text-sm font-semibold text-ink">{t("account.sentTitle")}</p> : null}
        <p className="text-sm text-ink/70">
          {t(mode === "sent" ? "account.sentBody" : "account.forgotSent", { email: normalizeEmail(email) })}
        </p>
        {mode === "sent" ? (
          <button type="button" className={LINK_CLASS} onClick={() => void resend()} disabled={busy}>
            {t("account.resend")}
          </button>
        ) : null}
        {notice ? <p className="text-xs text-ink/55">{notice}</p> : null}
        <button type="button" className={LINK_CLASS} onClick={() => switchMode("signIn")}>
          {t("account.goSignIn")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-left" style={{ fontFamily: "var(--font-sans)" }} noValidate>
      {mode !== "forgot" ? (
        <div className="flex gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border)" }} role="tablist">
          {(["signIn", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className="flex-1 rounded-lg px-3 py-1.5 text-sm transition-colors"
              style={
                mode === m
                  ? { backgroundColor: "var(--accent)", color: "#fff" }
                  : { color: "var(--ink)" }
              }
            >
              {t(`account.tabs.${m}`)}
            </button>
          ))}
        </div>
      ) : null}

      <label className="block space-y-1">
        <span className="text-xs text-ink/55">{t("account.email")}</span>
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLASS}
          style={{ borderColor: "var(--border)" }}
        />
      </label>
      {suggestion ? (
        <button type="button" className="text-xs font-medium" style={{ color: "var(--accent)" }} onClick={() => setEmail(suggestion)}>
          {t("account.didYouMean", { email: suggestion })}
        </button>
      ) : null}

      {mode === "register" ? (
        <label className="block space-y-1">
          <span className="text-xs text-ink/55">{t("account.emailConfirm")}</span>
          <input
            type="email"
            autoComplete="off"
            inputMode="email"
            value={emailConfirm}
            onChange={(e) => setEmailConfirm(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            className={INPUT_CLASS}
            style={{ borderColor: "var(--border)" }}
          />
        </label>
      ) : null}

      {mode !== "forgot" ? (
        <label className="block space-y-1">
          <span className="text-xs text-ink/55">
            {t("account.password")}
            {mode === "register" ? ` · ${t("account.passwordHint")}` : ""}
          </span>
          <input
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={PASSWORD_MIN}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT_CLASS}
            style={{ borderColor: "var(--border)" }}
          />
        </label>
      ) : null}

      {error ? (
        <div className="space-y-1">
          <p className="text-xs text-red-700">{errorText(error)}</p>
          {error === "email_not_verified" ? (
            <button type="button" className={LINK_CLASS} onClick={() => void resend()} disabled={busy}>
              {t("account.resend")}
            </button>
          ) : null}
        </div>
      ) : null}
      {notice ? <p className="text-xs text-ink/55">{notice}</p> : null}

      <button type="submit" disabled={busy} className={PRIMARY_CLASS} style={{ backgroundColor: "var(--accent)" }}>
        {busy
          ? t("account.working")
          : t(
              mode === "signIn"
                ? "account.submitSignIn"
                : mode === "register"
                  ? "account.submitRegister"
                  : "account.submitForgot",
            )}
      </button>

      <div className="flex justify-between">
        {mode === "signIn" ? (
          <button type="button" className={LINK_CLASS} onClick={() => switchMode("forgot")}>
            {t("account.forgot")}
          </button>
        ) : mode === "forgot" ? (
          <button type="button" className={LINK_CLASS} onClick={() => switchMode("signIn")}>
            {t("account.back")}
          </button>
        ) : (
          <span />
        )}
      </div>
    </form>
  );
}

/** "Sign in with Apple" on the site — shown only when the server has Apple configured. */
export const HAS_APPLE_WEB = process.env.NEXT_PUBLIC_AUTH_APPLE === "1";

export function AppleSignInRedirect() {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={() => {
        trackEvent({ action: "sign_in_start", category: "auth", label: "apple" });
        void signIn("apple");
      }}
      className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-black px-4 text-sm font-medium text-white"
    >
      {t("account.appleSignIn")}
    </button>
  );
}

export function OrDivider() {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-3 text-xs text-ink/40" style={{ fontFamily: "var(--font-sans)" }}>
      <span className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
      {t("account.or")}
      <span className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
    </div>
  );
}
