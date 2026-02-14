"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";

const NAV_LINKS = [
  { href: "/agents", label: "Browse" },
  { href: "/bundles", label: "Bundles" },
  { href: "/dev", label: "For Developers" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Left */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Agent Bazaar
          </Link>
          <div className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative py-1 transition-colors hover:text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-orange-500 after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <Link
            href="/atlas"
            className="hidden items-center gap-1.5 text-sm text-blue-400 transition-colors hover:text-blue-300 sm:flex"
          >
            <Sparkles size={14} />
            Atlas Beta
          </Link>
          <Link
            href="/dashboard"
            className="hidden rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] sm:block"
          >
            Sign In
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="text-zinc-400 transition-colors hover:text-white sm:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl px-6 py-4 sm:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-zinc-400 transition-colors hover:text-white py-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/atlas"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 text-sm text-blue-400 py-2"
            >
              <Sparkles size={14} />
              Atlas Beta
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-950"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
