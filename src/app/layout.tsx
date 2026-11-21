import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE_URL } from "@/shared/site";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    { path: "./fonts/vazirmatn-arabic-variable.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/vazirmatn-latin-variable.woff2", weight: "100 900", style: "normal" }
  ],
  variable: "--font-vazirmatn",
  display: "swap",
  preload: true,
  fallback: ["Tahoma", "Arial", "sans-serif"]
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "باشگاه شب قهرمانان | کرج",
  description: "معرفی باشگاه شب قهرمانان، پلن‌های عضویت، مربیان خصوصی و رزرو بازدید.",
  applicationName: "باشگاه شب قهرمانان",
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0c0e"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.variable}>{children}</body>
    </html>
  );
}
