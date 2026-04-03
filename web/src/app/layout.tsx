import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <Providers>
          <SiteNav />
          {children}
          <footer className="mx-auto max-w-6xl border-t border-ink/10 px-5 py-10 text-center text-xs text-ink/45">
            Fonte Hanzi + Pinyin:{" "}
            <a
              href="https://github.com/parlr/hanzi-pinyin-font"
              className="text-accent underline decoration-accent/25 underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              parlr/hanzi-pinyin-font
            </a>{" "}
            (CC-BY-SA-4.0).
          </footer>
        </Providers>
      </body>
    </html>
  );
}
