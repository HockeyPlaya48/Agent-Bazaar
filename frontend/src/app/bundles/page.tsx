"use client";

import { useState } from "react";
import Link from "next/link";
import { CAPABILITIES } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { X, Copy, Check, Zap } from "lucide-react";

const BUNDLES = [
  {
    id: "b1",
    name: "Content Creator Pack",
    description: "Everything you need to create, optimize, and publish content at scale.",
    capabilities: CAPABILITIES.filter((c) => ["blog-post-writer", "seo-analyzer", "dalle-image-gen", "web-scraper-api"].includes(c.slug)),
    discount: 0.30,
  },
  {
    id: "b2",
    name: "Developer Toolkit",
    description: "Code review, SQL generation, git auditing, and deployment — all in one pack.",
    capabilities: CAPABILITIES.filter((c) => ["gpt4-code-review", "sql-query-gen", "git-audit-cli", "deploy-cli"].includes(c.slug)),
    discount: 0.35,
  },
  {
    id: "b3",
    name: "Data & Research Pack",
    description: "Research, analyze, and extract insights from any data source at scale.",
    capabilities: CAPABILITIES.filter((c) => ["web-scraper-api", "csv-intelligence", "research-summarizer", "crypto-price-oracle"].includes(c.slug)),
    discount: 0.40,
  },
];

export default function BundlesPage() {
  const [activeBundle, setActiveBundle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedBundle = BUNDLES.find((b) => b.id === activeBundle);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-3xl font-bold">Skill Packs</h1>
        <p className="mt-2 text-zinc-400">
          Curated bundles of capabilities at a discounted rate. One integration, multiple skills — pay per call.
        </p>
      </FadeInUp>

      <StaggerContainer className="mt-8 space-y-6">
        {BUNDLES.map((bundle) => {
          const totalPrice = bundle.capabilities.reduce((sum, c) => sum + c.pricePerCall, 0);
          const discountedPrice = totalPrice * (1 - bundle.discount);

          return (
            <StaggerItem key={bundle.id}>
              <Card className="p-8 border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                  {bundle.capabilities.map((c) => (
                    <span key={c.id} className="text-2xl">{c.icon}</span>
                  ))}
                </div>
                <h3 className="mt-3 text-2xl font-bold">{bundle.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{bundle.description}</p>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-3xl font-bold">${discountedPrice.toFixed(2)}</span>
                  <span className="text-sm text-zinc-500 line-through">${totalPrice.toFixed(2)}</span>
                  <Badge variant="success">{Math.round(bundle.discount * 100)}% off per call</Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase text-zinc-500">Includes:</p>
                  {bundle.capabilities.map((cap) => (
                    <Link
                      key={cap.id}
                      href={`/agents/${cap.slug}`}
                      className="flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-orange-400"
                    >
                      <span>{cap.icon}</span>
                      <span>{cap.name}</span>
                      <span className="text-zinc-600">(${cap.pricePerCall}/call)</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-6">
                  <Button variant="primary" size="lg" onClick={() => setActiveBundle(bundle.id)}>
                    Get Bundle
                  </Button>
                  <p className="mt-2 text-xs text-zinc-500">No subscription — bundled rate per call via x402</p>
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Bundle Activation Modal */}
      {activeBundle && selectedBundle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedBundle.name}</h2>
                <button onClick={() => setActiveBundle(null)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
                  <Zap size={14} /> Bundle Activated — x402 Pay-Per-Call
                </div>
                <p className="text-sm text-zinc-300">
                  Every skill in this bundle is now available at a {Math.round(selectedBundle.discount * 100)}% discounted rate.
                  Your agent pays automatically via x402 on each call — no upfront cost.
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Your Bundle Endpoints</h3>
                <div className="space-y-3">
                  {selectedBundle.capabilities.map((cap) => {
                    const discounted = cap.pricePerCall * (1 - selectedBundle.discount);
                    return (
                      <div key={cap.id} className="bg-zinc-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{cap.icon} {cap.name}</span>
                          <span className="text-xs text-green-400">${discounted.toFixed(3)}/call</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs text-green-400 break-all">{cap.x402Endpoint}</code>
                          <button onClick={() => handleCopy(cap.x402Endpoint)} className="p-1 hover:bg-zinc-700 rounded shrink-0">
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Quick Start Code</h3>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <code className="text-xs text-zinc-300 whitespace-pre-wrap">
{`// Use any skill in the ${selectedBundle.name}
${selectedBundle.capabilities.map((cap) => `
// ${cap.icon} ${cap.name} ($${(cap.pricePerCall * (1 - selectedBundle.discount)).toFixed(3)}/call)
const ${cap.slug.replace(/-/g, '_')}_result = await fetch("${cap.x402Endpoint}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-402-Payment": paymentToken },
  body: JSON.stringify({ query: "your input" })
});`).join('\n')}`}
                  </code>
                  <button
                    onClick={() => handleCopy(selectedBundle.capabilities.map((cap) =>
                      `fetch("${cap.x402Endpoint}", { method: "POST", headers: { "Content-Type": "application/json", "X-402-Payment": paymentToken }, body: JSON.stringify({ query: "your input" }) })`
                    ).join('\n\n'))}
                    className="mt-2 p-1 hover:bg-zinc-700 rounded float-right"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setActiveBundle(null)} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium hover:bg-zinc-800 transition">
                  Close
                </button>
                <Link href="/dashboard" className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium text-center transition">
                  View in Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {copied && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 text-sm">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
