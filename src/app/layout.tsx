import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import NoiseBackground from "@/components/NoiseBackground";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hub",
  description: "Spincoaster Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${montserrat.className} ${geistMono.variable} antialiased`}
      >
        <NoiseBackground />
        {children}
      </body>
    </html>
  );
}
