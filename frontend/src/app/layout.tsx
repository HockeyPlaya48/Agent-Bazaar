import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NavBar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Providers } from "./providers";
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
  title: "Agent Bazaar — AI Skills Marketplace | x402 Pay-Per-Use",
  description: "Discover APIs, CLI tools, and agent skills. Pay per use with x402. No subscriptions. Agents shop autonomously.",
  keywords: "AI agents, x402, agent marketplace, API marketplace, pay per use, USDC, agent skills",
  openGraph: {
    title: "Agent Bazaar — AI Skills Marketplace | x402 Pay-Per-Use",
    description: "Discover APIs, CLI tools, and agent skills. Pay per use with x402. No subscriptions. Agents shop autonomously.",
    url: "https://agent-bazaar.com",
    siteName: "Agent Bazaar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Bazaar — AI Skills Marketplace | x402 Pay-Per-Use",
    description: "Discover APIs, CLI tools, and agent skills. Pay per use with x402. No subscriptions. Agents shop autonomously.",
  },
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
        <Providers>
          <NavBar />
          <main className="min-h-screen pt-[73px]">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
