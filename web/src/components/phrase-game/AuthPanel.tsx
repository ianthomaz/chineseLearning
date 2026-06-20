"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";

/** Disabled in static-export builds (no server route handlers). */
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PROGRESS_URL = `${BASE_PATH}/api/game/progress`;

export function AuthPanel() {
  const { t } = useLocale();

  if (!AUTH_ENABLED) {
    return (
      <div
        className="rounded-2xl border px-4 py-3 text-sm text-ink/60"
        style={{ borderColor: "var(--border)" }}
      >
        <span>{t("phraseGame.auth.guest")}</span>{" "}
        <span className="text-ink/40">· {t("phraseGame.auth.serverOnly")}</span>
      </div>
    );
  }

  return <AuthPanelLive label={t} />;
}

function AuthPanelLive({ label: t }: { label: (k: string, v?: Record<string, string | number>) => string }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-12 animate-pulse rounded-2xl border" style={{ borderColor: "var(--border)" }} />;
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-sm text-ink/60">{t("phraseGame.auth.guest")}</span>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="rounded-full border px-4 py-2 text-sm font-medium text-ink/80 hover:bg-ink/5"
          style={{ borderColor: "var(--border)" }}
        >
          {t("phraseGame.auth.signIn")}
        </button>
      </div>
    );
  }

  const name = session.user.name ?? session.user.email ?? "";
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="text-sm text-ink/70">{t("phraseGame.auth.greeting", { name })}</div>
      <div className="flex items-center gap-3">
        <NickEditor t={t} />
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-full border px-3 py-1.5 text-xs text-ink/60 hover:bg-ink/5"
          style={{ borderColor: "var(--border)" }}
        >
          {t("phraseGame.auth.signOut")}
        </button>
      </div>
    </div>
  );
}

function NickEditor({ t }: { t: (k: string, v?: Record<string, string | number>) => string }) {
  const [nick, setNick] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(PROGRESS_URL, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { nick?: string } | null) => {
        if (active && data?.nick) setNick(data.nick);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaved(false);
    try {
      await fetch(PROGRESS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nick }),
      });
      setSaved(true);
    } catch {
      /* ignore — nick is cosmetic for now */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={nick}
        onChange={(e) => {
          setNick(e.target.value);
          setSaved(false);
        }}
        placeholder={t("phraseGame.auth.nickLabel")}
        className="w-28 rounded-lg border px-2 py-1.5 text-sm"
        style={{ borderColor: "var(--border)" }}
        maxLength={24}
      />
      <button
        type="button"
        onClick={save}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {saved ? t("phraseGame.auth.nickSaved") : t("phraseGame.auth.nickSave")}
      </button>
    </div>
  );
}
