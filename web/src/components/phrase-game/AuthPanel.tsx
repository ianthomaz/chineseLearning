"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";
import { GoogleOneTap, GoogleSignInRedirect } from "./GoogleOneTap";
import { isAdminEmail } from "@/lib/phrase-game/admin";

/** Disabled in static-export builds (no server route handlers). */
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";
const HAS_ONE_TAP = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PROGRESS_URL = `${BASE_PATH}/api/game/progress`;

export function AuthPanel() {
  const { t, locale } = useLocale();

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

  return <AuthPanelLive t={t} locale={locale} />;
}

function AuthPanelLive({
  t,
  locale,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
  locale: string;
}) {
  const { data: session, status, update } = useSession();
  const [nick, setNick] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch(PROGRESS_URL, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { nick?: string } | null) => {
        if (active) setNick(data?.nick?.trim() ?? "");
      })
      .catch(() => {
        if (active) setNick("");
      });
    return () => {
      active = false;
    };
  }, [status]);

  if (status === "loading" || (status === "authenticated" && nick === null)) {
    return <div className="h-14 animate-pulse rounded-2xl border" style={{ borderColor: "var(--border)" }} />;
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <div
        className="rounded-2xl border px-4 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="text-sm text-ink/65">{t("phraseGame.auth.guestHint")}</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {HAS_ONE_TAP ? (
            <GoogleOneTap locale={locale} onSignedIn={() => void update()} />
          ) : (
            <GoogleSignInRedirect label={t("phraseGame.auth.signIn")} />
          )}
          {HAS_ONE_TAP ? (
            <GoogleSignInRedirect label={t("phraseGame.auth.signInAlt")} />
          ) : null}
        </div>
      </div>
    );
  }

  const savedNick = nick ?? "";
  const isAdmin = isAdminEmail(session.user.email);
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-9 w-9 rounded-full border object-cover" style={{ borderColor: "var(--border)" }} />
        ) : null}
        <p className="text-sm text-ink/70">
          {savedNick
            ? t("phraseGame.auth.greeting", { name: savedNick })
            : t("phraseGame.auth.greetingShort")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <a
            href={`${BASE_PATH}/backoffice`}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {t("phraseGame.auth.dashboard")}
          </a>
        ) : null}
        {!savedNick ? <NickEditor t={t} onSaved={setNick} /> : null}
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

function NickEditor({
  t,
  onSaved,
}: {
  t: (k: string, v?: Record<string, string | number>) => string;
  onSaved: (nick: string) => void;
}) {
  const [nick, setNick] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = nick.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const res = await fetch(PROGRESS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nick: trimmed }),
      });
      if (res.ok) {
        const data = (await res.json()) as { nick?: string };
        onSaved((data.nick ?? trimmed).trim());
      }
    } catch {
      /* ignore — nick is cosmetic for now */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        placeholder={t("phraseGame.auth.nickLabel")}
        className="w-28 rounded-lg border px-2 py-1.5 text-sm"
        style={{ borderColor: "var(--border)" }}
        maxLength={24}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
        }}
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={!nick.trim() || saving}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {t("phraseGame.auth.nickSave")}
      </button>
    </div>
  );
}
