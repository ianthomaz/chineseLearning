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
/** Standard four-color G. Google forbids recoloring it. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function GoogleSignInRedirect({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        trackEvent({ action: "sign_in_start", category: "auth", label: "google-redirect" });
        void signIn("google", undefined, { prompt: "select_account" });
      }}
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium text-ink/80 hover:bg-ink/5"
      style={{ borderColor: "var(--border)" }}
    >
      <GoogleMark />
      {label}
    </button>
  );
}
