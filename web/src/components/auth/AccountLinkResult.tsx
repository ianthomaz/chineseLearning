"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <div className="space-y-4 rounded-2xl border px-6 py-8" style={{ borderColor: "var(--border)", fontFamily: "var(--font-sans)" }}>
        {children}
      </div>
    </main>
  );
}

function SignInLink() {
  const { t } = useLocale();
  return (
    <Link
      href="/phrase-game#phrase-game-auth"
      className="inline-flex min-h-[44px] items-center rounded-xl px-4 text-sm font-semibold text-white"
      style={{ backgroundColor: "var(--accent)" }}
    >
      {t("account.goSignIn")}
    </Link>
  );
}

/** Outcome of an email link the server already handled. */
export function AccountLinkResult({ kind, error }: { kind: "verify" | "reset"; error: string | null }) {
  const { t } = useLocale();
  return (
    <Card>
      <p className={error ? "text-sm text-red-700" : "text-sm text-ink"}>
        {error ? t(`account.error.${error}`) : t(kind === "verify" ? "account.verifyOk" : "account.resetOk")}
      </p>
      <SignInLink />
    </Card>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useLocale();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("weak_password");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_PATH}/api/account/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) setDone(true);
      else setError(data.error ?? "generic");
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <AccountLinkResult kind="reset" error={null} />;

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <label className="block space-y-1">
          <span className="text-xs text-ink/55">
            {t("account.passwordNew")} · {t("account.passwordHint")}
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm text-ink"
            style={{ borderColor: "var(--border)" }}
          />
        </label>
        {error ? <p className="text-xs text-red-700">{t(`account.error.${error}`)}</p> : null}
        <button
          type="submit"
          disabled={busy || !token}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {busy ? t("account.working") : t("account.submitReset")}
        </button>
      </form>
    </Card>
  );
}
