import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for learnchinese.today — free educational Chinese learning platform operated by ITCS Webplace Ltda.",
  openGraph: {
    title: "Terms of Use · Learn Chinese",
    description:
      "Terms governing use of learnchinese.today, optional Google sign-in, and educational content.",
    url: "https://learnchinese.today/terms",
    siteName: "Learn Chinese",
  },
};

export default function TermsPage() {
  return <LegalDocument kind="terms" />;
}
