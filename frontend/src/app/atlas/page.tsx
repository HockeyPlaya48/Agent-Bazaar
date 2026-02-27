"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Search, Zap, Send, DollarSign, Clock, Target } from "lucide-react";
import { type CapabilityAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CapabilityCard } from "@/components/capability-card";
import { CAPABILITIES } from "@/lib/data";
import { FadeInUp, FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

// Workflow template cards
const WORKFLOW_TEMPLATES = [
  {
    id: "content-pipeline",
    name: "Content Pipeline",
    description: "Research → Write → Optimize → Visual assets",
    icon: "✍️",
    estimatedCost: "$0.35",
    estimatedTime: "58s",
    skills: ["research-summarizer", "blog-post-writer", "seo-analyzer", "dalle-image-gen"],
    query: "build a content pipeline for blogs and articles"
  },
  {
    id: "code-quality",
    name: "Code Quality",
    description: "Review → Audit → Optimize → Deploy",
    icon: "🔍",
    estimatedCost: "$0.10",
    estimatedTime: "70s",
    skills: ["gpt4-code-review", "git-audit-cli", "sql-query-gen", "deploy-cli"],
    query: "set up code quality and deployment pipeline"
  },
  {
    id: "data-pipeline",
    name: "Data Analysis",
    description: "Scrape → Process → Analyze → Report",
    icon: "📊",
    estimatedCost: "$0.22",
    estimatedTime: "47s",
    skills: ["web-scraper-api", "csv-intelligence", "research-summarizer"],
    query: "create data analysis and reporting workflow"
  },
  {
    id: "trading-pipeline",
    name: "Trading Bot",
    description: "Price data → Analysis → Signals → Execute",
    icon: "📈",
    estimatedCost: "$0.03",
    estimatedTime: "27s",
    skills: ["crypto-price-oracle", "csv-intelligence", "research-summarizer", "bankr-cli"],
    query: "build automated crypto trading system"
  }
];

export default function AtlasPage() {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [reasoning, setReasoning] = useState<string>("");

  async function handleSearch(e?: React.FormEvent, templateQuery?: string) {
    if (e) e.preventDefault();
    const searchQuery = templateQuery || query;
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/agent-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: searchQuery,
          budget: budget ? parseFloat(budget) : null
        }),
      });
      const data = await res.json();
      setResults(data);
      setReasoning(data.reasoning || "");
      if (templateQuery) {
        setQuery(templateQuery);
      }
    } catch {
      // Fallback: show popular skills
      const fallback = CAPABILITIES.slice(0, 4).map((c) => ({
        id: c.id, name: c.name, slug: c.slug, description: c.description,
        type: c.type, category: c.category, pricePerCall: c.pricePerCall,
        x402Endpoint: c.x402Endpoint, icon: c.icon, rating: c.rating,
        usageCount: c.usageCount, creatorName: c.creatorName,
      }));
      setResults({
        success: true,
        recommendations: fallback.map(cap => ({ capability: cap, relevanceScore: 80, reasoning: "Popular choice" })),
        suggestion: "Here are our most popular skills to get you started:",
        confidence: 50
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Hero */}
      <div className="relative text-center">
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center -top-32">
          <div className="h-[400px] w-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_70%)]" />
        </div>

        <FadeInUp>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
            <Bot size={32} />
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Agent Shopping
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
            Describe what you&apos;re building. Our AI will browse the marketplace and recommend the best capabilities for your workflow.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.2}>
          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-xl gap-3">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., I need to build an automated content pipeline..."
              className="rounded-full"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
            >
              <Search size={16} />
              Shop
            </Button>
          </form>
        </FadeInUp>

        {/* Example queries */}
        <FadeInUp delay={0.3}>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["code review", "trading bot", "content writing", "web scraping"].map((q) => (
              <button
                key={q}
                onClick={() => { setQuery(q); }}
                className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
        </FadeInUp>
      </div>

      {/* Results */}
      {results && (
        <FadeIn>
          <div className="mt-12">
            {reasoning && (
              <Card className="mb-6 p-4">
                <div className="flex items-start gap-3">
                  <Bot size={20} className="mt-0.5 shrink-0 text-orange-400" />
                  <p className="text-sm text-zinc-300">{reasoning}</p>
                </div>
              </Card>
            )}

            {results.length > 0 ? (
              <StaggerContainer className="grid gap-4 sm:grid-cols-2">
                {results.map((cap: any) => (
                  <StaggerItem key={cap.id}>
                    <Link href={`/agents/${cap.slug}`}>
                      <Card className="p-5 transition-all hover:border-orange-500/30">
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{cap.icon}</span>
                          <div>
                            <h3 className="font-semibold">{cap.name}</h3>
                            <p className="mt-1 text-xs text-zinc-500">by {cap.creator_name} · ${cap.price_per_call}/call</p>
                            <p className="mt-2 text-sm text-zinc-400">{cap.description}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge>{cap.type}</Badge>
                              <span className="text-xs text-yellow-500">{cap.rating} ★</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <p className="text-center text-zinc-500">No matching capabilities found. Try a different query.</p>
            )}
          </div>
        </FadeIn>
      )}

      {/* How it works */}
      {!results && (
        <FadeInUp delay={0.4}>
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { icon: <Search size={24} />, title: "Describe Your Need", desc: "Tell us what you're building or what task you need to automate" },
              { icon: <Bot size={24} />, title: "AI Shops for You", desc: "Our agent browses capabilities, compares pricing and ratings" },
              { icon: <Zap size={24} />, title: "Instant Integration", desc: "Get x402 endpoints ready to call from your code or agent" },
            ].map((step) => (
              <Card key={step.title} className="p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-orange-400">
                  {step.icon}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{step.desc}</p>
              </Card>
            ))}
          </div>
        </FadeInUp>
      )}
    </div>
  );
}
