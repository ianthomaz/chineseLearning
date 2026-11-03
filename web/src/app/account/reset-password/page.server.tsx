/** Password reset link (`/account/reset-password?token=…`) — SERVER MODE only. */
import { ResetPasswordForm } from "@/components/auth/AccountLinkResult";

export const dynamic = "force-dynamic";
export const metadata = { title: "LearnChinese Today", robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
