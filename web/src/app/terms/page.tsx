import { Suspense } from "react";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Use · Termos de Uso · 使用条款",
  description:
    "Terms of Use for learnchinese.today — free educational Chinese learning platform operated by ITCS Webplace Ltda. (PT, EN, ES, ZH).",
  openGraph: {
    title: "Terms of Use · Learn Chinese",
    description:
      "Terms governing use of learnchinese.today and iOS app LearnChinese Today.",
    url: "https://learnchinese.today/terms",
    siteName: "LearnChinese Today",
  },
};

export default function TermsPage() {
  return (
    <Suspense fallback={null}>
      <LegalDocument kind="terms" />
    </Suspense>
  );
}
