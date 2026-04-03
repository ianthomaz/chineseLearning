import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AppFooter } from "@/components/AppFooter";
import { Providers } from "@/components/Providers";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-46HMWMHG18";

const APP_NAME = "Chinês básico";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  title: {
    default: APP_NAME,
    template: "%s · Chinês básico",
  },
  description:
    "Revisão, vocabulário e gramática em blocos, a partir do consolidado do curso.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2d5a8c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Providers>
          <div className="flex min-h-dvh flex-col">
            <SiteNav />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <AppFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
