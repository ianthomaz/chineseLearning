import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Newsreader } from "next/font/google";
import { AppFooter } from "@/components/AppFooter";
import { Providers } from "@/components/Providers";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
});

const APP_NAME = "Learn Chinese";

const publicBase =
  (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "") || "";

const asset = (path: string) => `${publicBase}${path}`;

export const metadata: Metadata = {
  applicationName: APP_NAME,
  manifest: asset("/manifest.webmanifest"),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Free beginner Chinese learning — review, vocabulary, grammar, games, and lyrics.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: asset("/icons/apple-touch-icon.png"),
    icon: [
      { url: asset("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: asset("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2d5a8c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={newsreader.variable} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`}
        </Script>
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"
        />
        <link rel="stylesheet" href={`${publicBase}/pinyin-font.css`} />
      </head>
      <body>
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
