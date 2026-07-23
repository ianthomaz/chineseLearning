"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale } from "@/context/LocaleContext";
import { isAdminEmail } from "@/lib/phrase-game/admin";

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";

/** Discreet footer entry to the private lyric-card KTV — admin session only. */
export function FooterKtvLink() {
  const { t } = useLocale();
  const { data: session, status } = useSession();

  if (!AUTH_ENABLED || status !== "authenticated") return null;
  if (!isAdminEmail(session?.user?.email)) return null;

  return (
    <p className="mt-5 text-center">
      <Link
        href="/ktv"
        className="text-[11px] tracking-wide text-ink/30 transition-colors hover:text-accent"
        style={{ fontFamily: "var(--font-sans)" }}
        prefetch={false}
      >
        {t("footer.ktvLink")}
      </Link>
    </p>
  );
}
