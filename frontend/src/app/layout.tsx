import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/providers/query-provider";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/billos.png", type: "image/png" },
    ],
    shortcut: "/billos.png",
    apple: "/billos.png",
  },
};

import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AuthInterceptor } from "@/components/layout/AuthInterceptor";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="icon" href="/billos.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/billos.png" type="image/png" />
        <link rel="apple-touch-icon" href="/billos.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.hash.includes('type=signup')) {
                window.sessionStorage.setItem('verify_redirect', 'true');
                window.history.replaceState(null, '', window.location.pathname);
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden font-sans">
        <Providers>
          <AuthInterceptor />
          {children}
          <Toaster />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
