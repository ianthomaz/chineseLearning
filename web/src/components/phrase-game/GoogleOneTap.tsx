"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GIS_SRC = "https://accounts.google.com/gsi/client";

type Props = {
  /** Called after a successful One Tap sign-in (session refresh is async). */
  onSignedIn?: () => void;
  /** Locale hint for the Google button (pt, en, es). */
  locale?: string;
};

/**
 * Google Identity Services: One Tap prompt + official Sign-In button.
 * Falls back to redirect OAuth via the rendered button if One Tap is dismissed.
 */
export function GoogleOneTap({ onSignedIn, locale = "pt" }: Props) {
  const { t } = useLocale();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!scriptReady || !CLIENT_ID || initializedRef.current) return;
    const g = window.google?.accounts?.id;
    if (!g) return;

    initializedRef.current = true;

    g.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        setSigningIn(true);
        setError(null);
        try {
          const result = await signIn("google-onetap", {
            credential: response.credential,
            redirect: false,
          });
          if (result?.error) {
            setError("signin_failed");
          } else {
            onSignedIn?.();
          }
        } catch {
          setError("signin_failed");
        } finally {
          setSigningIn(false);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
    });

    if (buttonRef.current) {
      g.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 280,
        locale,
      });
    }

    g.prompt();
  }, [scriptReady, locale, onSignedIn]);

  if (!CLIENT_ID) return null;

  return (
    <>
      <Script src={GIS_SRC} strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div ref={buttonRef} className="min-h-[44px]" aria-busy={signingIn} />
        {signingIn ? (
          <p className="text-center text-xs text-ink/45 sm:text-right">{t("phraseGame.auth.signingIn")}</p>
        ) : null}
        {error ? (
          <p className="text-center text-xs text-red-700 sm:text-right">{t("phraseGame.auth.signInFailed")}</p>
        ) : null}
      </div>
    </>
  );
}

/** Redirect-based Google OAuth (popup-free fallback). */
export function GoogleSignInRedirect({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="rounded-full border px-4 py-2 text-sm font-medium text-ink/80 hover:bg-ink/5"
      style={{ borderColor: "var(--border)" }}
    >
      {label}
    </button>
  );
}
