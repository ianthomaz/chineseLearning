/**
 * Email confirmation link (`/account/verify?token=…`) — SERVER MODE only.
 * Opening it releases the account (NOIA clearance N3 → O4). Idempotent until
 * the link expires: mail scanners open links too.
 */
import { confirmEmailToken } from "@/server/account/service";
import { AccountLinkResult } from "@/components/auth/AccountLinkResult";

export const dynamic = "force-dynamic";
export const metadata = { title: "LearnChinese Today", robots: { index: false } };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = confirmEmailToken(token);
  return <AccountLinkResult kind="verify" error={result.ok ? null : result.error} />;
}
