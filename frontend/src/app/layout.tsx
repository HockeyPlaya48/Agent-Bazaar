import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Agent Bazaar — Discover & Buy AI Agents",
  description:
    "The deal marketplace for AI agents. Monthly plans, bundles, and one-click deploys. No code required.",
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
      </body>
    </html>
  );
}
