"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GIS_SRC = "https://accounts.google.com/gsi/client";

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

/**
 * Automatic One Tap only. Current GIS ignores `use_fedcm_for_prompt` and always
 * calls FedCM, which on 127.0.0.1 logs "Error retrieving a token" and Next's
 * dev overlay treats that console.error as an app failure. The button does not
 * use FedCM. Force with NEXT_PUBLIC_GSI_USE_FEDCM=1, or off with =0.
 */
function automaticOneTap(): boolean {
  if (process.env.NEXT_PUBLIC_GSI_USE_FEDCM === "0") return false;
  if (process.env.NEXT_PUBLIC_GSI_USE_FEDCM === "1") return true;
  return !isLocalDevHost();
}

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
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  useEffect(() => {
    if (!scriptReady || !CLIENT_ID) return;
    const g = window.google?.accounts?.id;
    if (!g) return;

    let cancelled = false;
    const oneTap = automaticOneTap();

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
            trackEvent({
              action: "sign_in_success",
              category: "auth",
              label: "google-onetap",
            });
            onSignedInRef.current?.();
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
      use_fedcm_for_prompt: oneTap,
      use_fedcm_for_button: false,
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

    // One Tap on the public https origin. Locally it only produces the FedCM
    // console error; the button above is the sign-in.
    const promptTimer = oneTap
      ? window.setTimeout(() => {
          if (cancelled) return;
          g.prompt();
        }, 100)
      : 0;

    return () => {
      cancelled = true;
      window.clearTimeout(promptTimer);
      try {
        g.cancel();
      } catch {
        /* ignore — cancel may race with an in-flight FedCM prompt */
      }
    };
  }, [scriptReady, locale]);

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

/**
 * Redirect Google OAuth. Always asks which account — the GIS button often
 * sticks to the last one; this is the "another account" path.
 */
export function GoogleSignInRedirect({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        trackEvent({ action: "sign_in_start", category: "auth", label: "google-redirect" });
        void signIn("google", undefined, { prompt: "select_account" });
      }}
      className="inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium text-ink/80 hover:bg-ink/5"
      style={{ borderColor: "var(--border)" }}
    >
      {label}
    </button>
  );
}
