import type { Metadata } from "next";
import { Cabin, Geist_Mono } from "next/font/google";
import NoiseBackground from "@/components/NoiseBackground";
import "./globals.css";

const cabin = Cabin({
  variable: "--font-cabin",
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
        className={`${cabin.variable} ${geistMono.variable} antialiased`}
      >
        <NoiseBackground />
        {children}
      </body>
    </html>
  );
}
