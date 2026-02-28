import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NavBar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Bazaar — Discover Agent Skills",
  description:
    "The deal marketplace for agent skills. APIs, CLI tools, and agent skills — all pay-per-use via x402. Humans and agents welcome.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50 overflow-x-hidden`}
      >
        <NavBar />
        <main className="min-h-screen pt-[73px]">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
