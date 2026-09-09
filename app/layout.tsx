import type { Metadata } from "next";
import data from "@/data/index.json";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import { SITE_URL } from "@/lib/skills";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-display",
  display: "swap",
});

const sans = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["400", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const { skills, sources } = data.stats;

export const metadata: Metadata = {
  // Relative canonical and Open Graph URLs on the per-skill pages resolve
  // against this, so it has to be the deployed origin.
  metadataBase: new URL(SITE_URL || "http://localhost:3000"),
  title: { default: "Claude Skills Index", template: "%s — Claude Skills Index" },
  description:
    `ค้นหาและคัดลอกสกิลทั้ง ${skills} ตัวจาก ${sources} คลัง ไปใช้กับ Claude Code, ` +
    "Claude.ai, ChatGPT หรือ Gemini",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
