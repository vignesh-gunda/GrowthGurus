import type { Metadata } from "next";
import { DM_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const displayFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Growth Gurus",
  description: "Marketing on Auto Pilot"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
