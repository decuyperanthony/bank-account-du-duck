import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Bank Account du Duck V2",
  description: "Gestion des prélèvements",
  manifest: "/manifest.json?v=2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Duck Bank V2",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F5F2" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-x.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-12.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-14-pro.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-12-pro-max.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-14-pro-max.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-xr.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-8.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ipad.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className="antialiased">
        {/* Splash screen - hidden via CSS, not removed */}
        <div
          id="splash-screen"
          className="splash-screen"
          aria-hidden="true"
        >
          <div className="splash-content">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192x192.png?v=2" alt="" width={96} height={96} className="splash-icon rounded-3xl" />
          </div>
        </div>
        <ThemeProvider>{children}</ThemeProvider>
        <script src="/splash-hide.js" defer />
      </body>
    </html>
  );
}
