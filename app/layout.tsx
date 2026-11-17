import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { getLang } from "@/lib/i18n";
import "./globals.css";

const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-body" });
const head = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-head" });

export const metadata: Metadata = {
  title: "Ocean Glass",
  description: "Private business learning app",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang === "bs" ? "bs" : "en"} className={`${body.variable} ${head.variable}`}>
      <body>{children}</body>
    </html>
  );
}
