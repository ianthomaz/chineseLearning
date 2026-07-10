"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";

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
        href="/phrase-game"
        className="flex min-h-[44px] items-center rounded-full border px-3 text-xs font-medium text-ink/65 transition-colors hover:bg-ink/5 sm:px-4"
        style={{ borderColor: "var(--border)", fontFamily: "var(--font-sans)" }}
        title={t("nav.authSignInHint")}
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
        onClick={() => signOut()}
        className="rounded-full border px-3 py-2 text-xs font-medium text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
        style={{ borderColor: "var(--border)" }}
      >
        {t("nav.authSignOut")}
      </button>
    </div>
  );
}
