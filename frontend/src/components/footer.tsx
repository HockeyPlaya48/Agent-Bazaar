import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/agents", label: "Browse Agents" },
  { href: "/bundles", label: "Bundles" },
  { href: "/atlas", label: "Atlas Beta" },
];

const COMPANY_LINKS = [
  { href: "/dev", label: "Developer Portal" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-lg font-bold">
              Agent Bazaar
            </Link>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              The deal marketplace for AI agents. Lifetime deals, bundles, and
              one-click deploys. No code required.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Product
            </h4>
            <div className="mt-4 flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Company
            </h4>
            <div className="mt-4 flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800/50 pt-8">
          <p className="text-xs text-zinc-600">
            Agent Bazaar &copy; {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
