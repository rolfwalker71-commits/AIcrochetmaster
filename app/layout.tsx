import { AppShell } from "@/components/app-shell";
import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "AIcrochetmaster",
  description: "YouTube-Häkelvideos in lückenlose Anleitungen verwandeln.",
  applicationName: "AIcrochetmaster",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Häkelmeister",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#C45C26",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${nunito.variable} ${fraunces.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
