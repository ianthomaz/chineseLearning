import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for learnchinese.today — how ITCS Webplace Ltda. handles personal data, cookies, Google sign-in, and Google Analytics.",
  openGraph: {
    title: "Privacy Policy · Learn Chinese",
    description:
      "How learnchinese.today handles personal data, authentication, analytics, and your rights under LGPD.",
    url: "https://learnchinese.today/privacy",
    siteName: "Learn Chinese",
  },
};

export default function PrivacyPage() {
  return <LegalDocument kind="privacy" />;
}
