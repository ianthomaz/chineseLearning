"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";

const NAV_LINK_INACTIVE_CLASS =
  "flex min-h-[44px] items-center rounded-full px-3 text-sm text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink";

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";

export function SiteNavAuth() {
  // Static export has no SessionProvider; bail out before touching useSession.
  if (!AUTH_ENABLED) return null;
  return <SiteNavAuthLive />;
}

function SiteNavAuthLive() {
  const { t } = useLocale();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span
        className="hidden min-h-[44px] items-center px-2 text-xs text-ink/35 sm:flex"
        style={{ fontFamily: "var(--font-sans)" }}
        aria-hidden
      >
        …
      </span>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/phrase-game#phrase-game-auth"
        className={NAV_LINK_INACTIVE_CLASS}
        style={{ fontFamily: "var(--font-sans)" }}
        title={t("nav.authSignInHint")}
        onClick={() =>
          trackEvent({ action: "sign_in_start", category: "auth", label: "nav" })
        }
      >
        {t("nav.authSignIn")}
      </Link>
    );
  }

  const label = session.user.name ?? session.user.email ?? t("nav.authSignedIn");

  return (
    <div
      className="flex min-h-[44px] items-center gap-1.5 sm:gap-2"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt=""
          width={28}
          height={28}
          className="hidden rounded-full sm:block"
        />
      ) : null}
      <span className="hidden max-w-[8rem] truncate text-xs text-ink/55 sm:inline" title={label}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => {
          trackEvent({ action: "sign_out", category: "auth", label: "nav" });
          void signOut();
        }}
        className={NAV_LINK_INACTIVE_CLASS}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {t("nav.authSignOut")}
      </button>
    </div>
  );
}
