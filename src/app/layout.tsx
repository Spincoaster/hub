import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import NoiseBackground from "@/components/NoiseBackground";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://hub.spincoaster.com";

export const metadata: Metadata = {
  title: {
    default: "Spincoaster Music Bar",
    template: "%s | Spincoaster Music Bar",
  },
  description:
    "Spincoaster Music Bar - Shinjuku, Ebisu, Kagurazaka. Discover our vinyl collection and hi-res music library.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "Spincoaster Music Bar",
    title: "Spincoaster Music Bar",
    description:
      "Spincoaster Music Bar - Shinjuku, Ebisu, Kagurazaka. Discover our vinyl collection and hi-res music library.",
    url: SITE_URL,
    images: [
      {
        url: "/bar_logo.png",
        width: 1115,
        height: 1115,
        alt: "Spincoaster Music Bar",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Spincoaster Music Bar",
    description:
      "Spincoaster Music Bar - Shinjuku, Ebisu, Kagurazaka. Discover our vinyl collection and hi-res music library.",
    images: ["/bar_logo.png"],
  },
  robots: {
    index: false,
    follow: true,
  },
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" translate="no" className="notranslate">
      <head>
        <GoogleAnalytics />
      </head>
      <body
        className={`${montserrat.className} ${geistMono.variable} antialiased`}
      >
        <NoiseBackground />
        {children}
      </body>
    </html>
  );
}
