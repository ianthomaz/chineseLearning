/**
 * Account linking link (`/account/link?token=…`) — SERVER MODE only.
 * Opening it confirms the link token and merges accounts if the target email
 * belongs to an existing user.
 */
import { confirmLinkEmailToken } from "@/server/account/service";
import { AccountLinkResult } from "@/components/auth/AccountLinkResult";

export const dynamic = "force-dynamic";
export const metadata = { title: "LearnChinese Today", robots: { index: false } };

export default async function LinkAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = confirmLinkEmailToken(token);
  return <AccountLinkResult kind="link" error={result.ok ? null : result.error} />;
}
