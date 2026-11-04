"use client";

import { useSession } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";
import { GoogleOneTap, GoogleSignInRedirect } from "./phrase-game/GoogleOneTap";
import {
  AlipayErrorNote,
  AlipaySignInRedirect,
  AppleSignInRedirect,
  EmailAuthForm,
  HAS_ALIPAY_WEB,
  HAS_APPLE_WEB,
  OrDivider,
} from "./auth/EmailAuthForm";

/** Disabled in static-export builds (no server route handlers / OAuth). */
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";
const HAS_ONE_TAP = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

/**
 * Blocking login gate for interactive features (docs/05_autenticacao.md). Renders the
 * children untouched for signed-in users; guests get a Google sign-in card,
 * and the static export shows a "server version only" notice.
 */
export function LoginGate({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  if (!AUTH_ENABLED) {
    return (
      <main className="mx-auto w-full max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">{t("authGate.disabledTitle")}</h1>
        <p
          className="mt-3 text-sm text-ink/60"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {t("authGate.disabledBody")}
        </p>
      </main>
    );
  }

  return <LoginGateLive>{children}</LoginGateLive>;
}

function LoginGateLive({ children }: { children: React.ReactNode }) {
  const { t, locale } = useLocale();
  const { data: session, status, update } = useSession();

  if (status === "loading") {
    return (
      <main className="mx-auto w-full max-w-lg px-6 py-20">
        <div
          className="h-14 animate-pulse rounded-2xl border"
          style={{ borderColor: "var(--border)" }}
          aria-hidden
        />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-lg px-6 py-20 text-center">
        <div
          className="rounded-2xl border px-6 py-8"
          style={{ borderColor: "var(--border)" }}
        >
          <h1 className="font-display text-2xl text-ink">{t("authGate.title")}</h1>
          <p
            className="mt-3 text-sm text-ink/60"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("authGate.hint")}
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <AlipayErrorNote />
            {HAS_ONE_TAP ? (
              <>
                <GoogleOneTap locale={locale} onSignedIn={() => void update()} />
                <GoogleSignInRedirect label={t("authGate.signInAlt")} />
              </>
            ) : (
              <GoogleSignInRedirect label={t("authGate.signIn")} />
            )}
            {HAS_APPLE_WEB ? <AppleSignInRedirect /> : null}
            {HAS_ALIPAY_WEB ? <AlipaySignInRedirect /> : null}
          </div>
          <div className="mt-6 space-y-4">
            <OrDivider />
            <EmailAuthForm onSignedIn={() => void update()} />
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
