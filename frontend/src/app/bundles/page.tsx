"use client";

import Link from "next/link";
import { CAPABILITIES } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

// Curated capability bundles using actual slugs from data.ts
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
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-3xl font-bold">Skill Packs</h1>
        <p className="mt-2 text-zinc-400">
          Curated bundles of capabilities at a discount. One integration, multiple skills.
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
                  <Button variant="primary" size="lg">
                    Get Bundle
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
