import { Suspense } from "react";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy · Política de Privacidade · 隐私政策",
  description:
    "Privacy Policy for learnchinese.today and iOS app LearnChinese Today (PT, EN, ES, ZH) operated by ITCS Webplace Ltda.",
  openGraph: {
    title: "Privacy Policy · Learn Chinese",
    description:
      "Privacy Policy explaining how user data, educational progress, and authentication are handled.",
    url: "https://learnchinese.today/privacy",
    siteName: "LearnChinese Today",
  },
};

export default function PrivacyPage() {
  return (
    <Suspense fallback={null}>
      <LegalDocument kind="privacy" />
    </Suspense>
  );
}
