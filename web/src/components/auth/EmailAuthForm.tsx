"use client";

import { useEffect, useState } from "react";
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

      <div className="flex justify-center">
        {mode === "signIn" ? (
          <button type="button" className={LINK_CLASS} onClick={() => switchMode("forgot")}>
            {t("account.forgot")}
          </button>
        ) : mode === "forgot" ? (
          <button type="button" className={LINK_CLASS} onClick={() => switchMode("signIn")}>
            {t("account.back")}
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** "Sign in with Apple" on the site — shown only when the server has Apple configured. */
export const HAS_APPLE_WEB = process.env.NEXT_PUBLIC_AUTH_APPLE === "1";

export const HAS_ALIPAY_WEB = process.env.NEXT_PUBLIC_AUTH_ALIPAY === "1";

/** Shown after `/api/auth/alipay/callback` sends the person back with `authError=alipay`. */
export function AlipayErrorNote() {
  const { t } = useLocale();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShow(params.get("authError") === "alipay");
  }, []);
  if (!show) return null;
  return <p className="text-center text-xs text-red-700">{t("account.alipayFailed")}</p>;
}

function AlipayMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809"
      />
    </svg>
  );
}

export function AlipaySignInRedirect() {
  const { t } = useLocale();
  return (
    <a
      href={`${BASE_PATH}/api/auth/alipay/start`}
      onClick={() => trackEvent({ action: "sign_in_start", category: "auth", label: "alipay" })}
      className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-white whitespace-nowrap"
      style={{ backgroundColor: "#1677ff" }}
    >
      <AlipayMark />
      {t("account.alipaySignIn")}
    </a>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
      />
    </svg>
  );
}

export function AppleSignInRedirect() {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={() => {
        trackEvent({ action: "sign_in_start", category: "auth", label: "apple" });
        void signIn("apple");
      }}
      className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full bg-black px-4 text-sm font-medium text-white whitespace-nowrap"
    >
      <AppleMark />
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
