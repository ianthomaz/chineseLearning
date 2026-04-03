import type { Metadata } from "next";
import { AppFooter } from "@/components/AppFooter";
import { Providers } from "@/components/Providers";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Chinês básico",
    template: "%s · Chinês básico",
  },
  description:
    "Revisão, vocabulário e gramática em blocos, a partir do consolidado do curso.",
};

const publicBase =
  (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "") || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/*
          Hanzi Pinyin woff2 lives in public/fonts. This sheet uses a relative url()
          so it works under basePath; bundling @font-face in globals.css produced
          invalid webpack:// URLs in static export.
        */}
        <link rel="stylesheet" href={`${publicBase}/pinyin-font.css`} />
      </head>
      <body className="min-h-screen">
        <Providers>
          <SiteNav />
          {children}
          <AppFooter />
        </Providers>
      </body>
    </html>
  );
}
