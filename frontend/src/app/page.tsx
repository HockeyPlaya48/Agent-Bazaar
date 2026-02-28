"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Zap, CreditCard, Rocket, Bot, Terminal, Globe, Cpu, Send, X } from "lucide-react";
import Link from "next/link";
import { CAPABILITIES, CATEGORIES } from "@/lib/data";
import { agentShop, apiToCapability } from "@/lib/api";
import { Capability } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CapabilityCard } from "@/components/capability-card";
import { SectionHeader } from "@/components/section-header";
import { CategoryFilter } from "@/components/category-filter";
import { LiveTicker } from "@/components/live-ticker";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showAgentShop, setShowAgentShop] = useState(false);
  const [shopQuery, setShopQuery] = useState("");
  const [shopBudget, setShopBudget] = useState("");
  const [shopLoading, setShopLoading] = useState(false);
  const [shopResults, setShopResults] = useState<{ 
    recommendations: Capability[]; 
    reasoning: string;
    workflow?: any;
    alternatives?: string[];
    confidence?: number;
    estimatedCostPerUse?: string;
    budgetUtilization?: string;
  } | null>(null);

  // Fetch from Supabase via API, fall back to static data
  const [capabilities, setCapabilities] = useState<Capability[]>(CAPABILITIES);
  
  useEffect(() => {
    fetch("/api/capabilities")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setCapabilities(data.data);
        }
      })
      .catch(() => {}); // silent fallback to static
  }, []);

  const handleAgentShop = async () => {
    if (!shopQuery.trim()) return;
    
    try {
      setShopLoading(true);
      // Call our Next.js API route directly (works on Vercel)
      const res = await fetch("/api/agent-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: shopQuery,
          budget: shopBudget ? parseFloat(shopBudget) : null
        }),
      });
      const response = await res.json();
      
      // Map recommendations back to Capability type
      const mappedRecommendations = (response.recommendations || []).map((rec: any) => {
        const cap = CAPABILITIES.find(c => c.slug === rec.capability.slug);
        return cap || {
          id: rec.capability.id,
          name: rec.capability.name,
          slug: rec.capability.slug,
          description: rec.capability.description,
          longDescription: rec.capability.description,
          type: rec.capability.type,
          category: rec.capability.category || "automation",
          pricePerCall: rec.capability.pricePerCall,
          x402Endpoint: rec.capability.x402Endpoint || "",
          icon: rec.capability.icon || "🔧",
          rating: rec.capability.rating,
          usageCount: rec.capability.usageCount,
          featured: false,
          tags: [],
          creatorName: "Agent Bazaar",
        };
      });
      
      setShopResults({
        recommendations: mappedRecommendations,
        reasoning: response.suggestion || `Based on your query "${shopQuery}", here are the recommended skills:`,
        workflow: response.workflow,
        alternatives: response.alternatives || [],
        confidence: response.confidence,
        estimatedCostPerUse: response.estimatedCostPerUse,
        budgetUtilization: response.budgetUtilization
      });
    } catch (error) {
      console.error("Agent shop failed:", error);
      // Fallback: search local data
      const searchResults = capabilities.filter(cap => 
        cap.name.toLowerCase().includes(shopQuery.toLowerCase()) ||
        cap.description.toLowerCase().includes(shopQuery.toLowerCase()) ||
        cap.tags.some(tag => tag.toLowerCase().includes(shopQuery.toLowerCase()))
      ).slice(0, 5);
      
      setShopResults({
        recommendations: searchResults.length > 0 ? searchResults : CAPABILITIES.slice(0, 5),
        reasoning: searchResults.length > 0
          ? `Here are skills matching "${shopQuery}":`
          : `Here are our most popular skills to get you started:`,
        workflow: null,
        alternatives: [],
        confidence: 50
      });
    } finally {
      setShopLoading(false);
    }
  };

  const featuredCapabilities = useMemo(() => {
    return capabilities.filter((c) => c.featured);
  }, [capabilities]);

  const filtered = useMemo(() => {
    const tierOrder = { spotlight: 0, featured: 1, free: 2, undefined: 2 };
    return capabilities.filter((cap) => {
      const matchesSearch =
        !search ||
        cap.name.toLowerCase().includes(search.toLowerCase()) ||
        cap.tags.some((t) => t.includes(search.toLowerCase()));
      const matchesCategory = !selectedCategory || cap.category === selectedCategory;
      const matchesType = !selectedType || cap.type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    }).sort((a, b) => {
      const ta = tierOrder[a.listingTier || "free"] ?? 2;
      const tb = tierOrder[b.listingTier || "free"] ?? 2;
      return ta - tb;
    });
  }, [search, selectedCategory, selectedType, capabilities]);

  return (
    <div>
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-20">
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[600px] w-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <FadeInUp>
            <Badge variant="deal" className="px-4 py-1.5 text-sm">
              The First Marketplace Where Agents Shop For You
            </Badge>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
              Discover Agent Skills.
              <br />
              <span className="gradient-text-orange">Pay Per Use.</span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
              APIs, CLI tools, and agent skills for every workflow — all x402-enabled. Humans browse, agents shop autonomously. Developers earn from every call.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.3}>
            <div className="mx-auto mt-8 max-w-lg">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills (e.g., code review, image gen, trading bot)..."
                icon={<Search size={18} />}
                className="rounded-full py-3.5"
              />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <div className="mx-auto mt-8 flex max-w-md justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{capabilities.length}+</p>
                <p className="text-sm text-zinc-500">Skills Listed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {(capabilities.reduce((sum, c) => sum + (c.usageCount || 0), 0) / 1_000_000).toFixed(1)}M+
                </p>
                <p className="text-sm text-zinc-500">Skill Calls</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">x402</p>
                <p className="text-sm text-zinc-500">Agent Payment Rail</p>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Live Ticker */}
      <LiveTicker />

      {/* How It Works */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            <h2 className="mb-8 text-center text-2xl font-bold text-white">How It Works</h2>
          </FadeInUp>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: <Search size={28} />, title: "Browse Skills", desc: "Find APIs, CLI tools, and agent skills for any task or workflow" },
              { icon: <CreditCard size={28} />, title: "Pay via x402", desc: "Pay-per-use. No subscriptions. Agents pay autonomously via x402." },
              { icon: <Rocket size={28} />, title: "Deploy Instantly", desc: "One call to integrate. Or let our AI agent shop skills for you." },
            ].map((step, i) => (
              <FadeInUp key={step.title} delay={i * 0.1}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-orange-400">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{step.desc}</p>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* Type Filter Pills */}
      <section className="px-6 pb-4">
        <div className="mx-auto flex max-w-7xl justify-center gap-2">
          {[
            { value: null, label: "All", icon: <Globe size={14} /> },
            { value: "api", label: "APIs", icon: <Cpu size={14} /> },
            { value: "cli", label: "CLI Tools", icon: <Terminal size={14} /> },
            { value: "skill", label: "Agent Skills", icon: <Bot size={14} /> },
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => setSelectedType(t.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedType === t.value
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 pb-8">
        <div className="mx-auto flex max-w-7xl justify-center">
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            categories={CATEGORIES}
          />
        </div>
      </section>

      {/* Featured Capabilities */}
      {!search && !selectedCategory && !selectedType && featuredCapabilities.length > 0 && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title="Featured Skills" />
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCapabilities.map((cap) => (
                <StaggerItem key={cap.id}>
                  <CapabilityCard capability={cap} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Agent Shopping CTA */}
      {!search && !selectedCategory && !selectedType && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-4xl">
            <FadeInUp>
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8 sm:p-10">
                <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/5 blur-3xl" />
                <div className="relative flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                    <Bot size={32} />
                  </div>
                  <div>
                    <Badge variant="deal" className="mb-3">
                      ⚡ First marketplace where agents shop for you
                    </Badge>
                    <h2 className="text-2xl font-bold text-white">AI Agent Shopping</h2>
                    <p className="mt-2 max-w-xl text-zinc-400">
                      Describe your goal. Our AI discovers skills, chains them into workflows, and shows you exactly how they work together — with cost breakdowns and deployment-ready code.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="category" className="text-xs">🔗 Workflow Builder</Badge>
                      <Badge variant="category" className="text-xs">💰 Budget Controls</Badge>
                      <Badge variant="category" className="text-xs">🧠 Smart Reasoning</Badge>
                    </div>
                    <button 
                      onClick={() => setShowAgentShop(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Zap size={16} /> Start Workflow Shopping
                    </button>
                  </div>
                </div>
              </div>
            </FadeInUp>
          </div>
        </section>
      )}

      {/* All Capabilities */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={
              search
                ? `Results for "${search}"`
                : selectedCategory
                ? CATEGORIES.find((c) => c.value === selectedCategory)?.label || "Skills"
                : "All Skills"
            }
          />
          
          <StaggerContainer
            key={`${search}-${selectedCategory}-${selectedType}`}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((cap) => (
              <StaggerItem key={cap.id}>
                <CapabilityCard capability={cap} />
              </StaggerItem>
            ))}
          </StaggerContainer>
          
          {filtered.length === 0 && (
            <p className="py-12 text-center text-zinc-500">
              No skills found. Try a different search or category.
            </p>
          )}
        </div>
      </section>

      {/* CLI Tools Section */}
      {!search && !selectedCategory && !selectedType && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <FadeInUp>
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8 mb-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-green-500/5 blur-3xl" />
                <div className="relative flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
                    <Terminal size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">CLI Tools for Developers</h2>
                    <p className="mt-2 max-w-xl text-zinc-400">
                      Install and run from your terminal. Perfect for CI/CD pipelines and developer workflows.
                    </p>
                  </div>
                </div>
              </div>
            </FadeInUp>
            
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {capabilities.filter(cap => cap.type === "cli").map((cap) => (
                <StaggerItem key={cap.id}>
                  <CapabilityCard capability={cap} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Agent Skills Section */}
      {!search && !selectedCategory && !selectedType && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <FadeInUp>
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8 mb-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-purple-500/5 blur-3xl" />
                <div className="relative flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                    <Bot size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Composable Agent Skills</h2>
                    <p className="mt-2 max-w-xl text-zinc-400">
                      Drop into any agent framework. Memory, scheduling, email, web search — the building blocks of autonomous agents.
                    </p>
                  </div>
                </div>
              </div>
            </FadeInUp>
            
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {capabilities.filter(cap => cap.type === "skill").map((cap) => (
                <StaggerItem key={cap.id}>
                  <CapabilityCard capability={cap} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Developer Promotion Tiers */}
      {!search && !selectedCategory && !selectedType && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-5xl">
            <FadeInUp>
              <h2 className="mb-2 text-center text-2xl font-bold text-white">Promote Your Skill</h2>
              <p className="mb-8 text-center text-zinc-400">Get discovered faster. Only skills with 4.0+ rating qualify for promoted tiers.</p>
            </FadeInUp>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  tier: "Free",
                  price: "$0",
                  period: "forever",
                  features: ["Listed in Skills marketplace", "Searchable by agents & humans", "Basic analytics", "x402 payment rail included"],
                  border: "border-zinc-800",
                  badge: "",
                },
                {
                  tier: "Featured",
                  price: "$49",
                  period: "/mo",
                  features: ["★ Featured badge on card", "Priority in category results", "Appears in agent recommendations", "Detailed analytics dashboard", "Everything in Free"],
                  border: "border-amber-500/30",
                  badge: "★ POPULAR",
                },
                {
                  tier: "Spotlight",
                  price: "$149",
                  period: "/mo",
                  features: ["⚡ Spotlight badge + glow border", "Homepage featured placement", "Top of all search results", "Priority in AI agent shopping", "Conversion analytics + A/B", "Everything in Featured"],
                  border: "border-orange-500/30",
                  badge: "⚡ MAX VISIBILITY",
                },
              ].map((plan, i) => (
                <FadeInUp key={plan.tier} delay={i * 0.1}>
                  <div className={`rounded-xl border ${plan.border} bg-zinc-900/50 p-6 ${plan.tier === "Spotlight" ? "ring-1 ring-orange-500/10" : ""}`}>
                    {plan.badge && (
                      <span className={`mb-3 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${plan.tier === "Spotlight" ? "bg-orange-500/10 text-orange-400 border border-orange-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                        {plan.badge}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white">{plan.tier}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-zinc-500">{plan.period}</span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                          <span className="mt-0.5 text-green-500">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button className={`mt-5 w-full rounded-full py-2 text-sm font-semibold transition ${plan.tier === "Spotlight" ? "bg-orange-500 text-white hover:bg-orange-600" : plan.tier === "Featured" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
                      {plan.tier === "Free" ? "List for Free" : `Get ${plan.tier}`}
                    </button>
                  </div>
                </FadeInUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Creator CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <h2 className="text-3xl font-bold text-white">
                Built an API? A CLI Tool? An Agent Skill?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-zinc-400">
                List your skill on Agent Bazaar. Set your price, get an x402 endpoint, and start earning from every call — human or agent.
              </p>
              <Link
                href="/dev"
                className="mt-6 inline-block rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 font-semibold text-white transition hover:opacity-90"
              >
                List a Skill
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Agent Shopping Modal */}
      {showAgentShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Bot size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Workflow Shopping</h2>
                    <Badge variant="deal" className="text-xs mt-1">⚡ First marketplace where agents shop for you</Badge>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAgentShop(false);
                    setShopQuery("");
                    setShopBudget("");
                    setShopResults(null);
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="mt-4 text-zinc-400">
                Describe your goal and budget. Our AI will discover the best skills and chain them into a complete workflow with cost estimates.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={shopQuery}
                    onChange={(e) => setShopQuery(e.target.value)}
                    placeholder="e.g., I need to build a content pipeline that generates blog posts and optimizes them for SEO"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAgentShop()}
                  />
                  <Input
                    type="number"
                    value={shopBudget}
                    onChange={(e) => setShopBudget(e.target.value)}
                    placeholder="Budget (optional)"
                    className="w-32"
                    step="0.01"
                    min="0"
                  />
                  <button
                    onClick={handleAgentShop}
                    disabled={shopLoading || !shopQuery.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <Send size={16} />
                    {shopLoading ? "Shopping..." : "Shop"}
                  </button>
                </div>
                
                {/* Quick Templates */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "build a content pipeline",
                    "create a trading bot",
                    "automate code reviews",
                    "scrape and analyze data"
                  ].map((template) => (
                    <button
                      key={template}
                      onClick={() => setShopQuery(template)}
                      className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              {shopLoading && (
                <div className="mt-6 text-center py-8">
                  <div className="inline-flex items-center gap-2 text-orange-400">
                    <Bot size={20} className="animate-pulse" />
                    <span>AI is analyzing your needs and building a workflow...</span>
                  </div>
                </div>
              )}

              {shopResults && (
                <div className="mt-6 space-y-6">
                  {/* AI Reasoning */}
                  <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <div className="flex items-start gap-3">
                      <Bot size={20} className="text-orange-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-orange-400">AI Analysis</h3>
                          {shopResults.confidence && (
                            <Badge variant={shopResults.confidence > 80 ? "success" : "default"} className="text-xs">
                              {shopResults.confidence}% confidence
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-300">{shopResults.reasoning}</p>
                        {shopResults.estimatedCostPerUse && (
                          <p className="text-xs text-zinc-400 mt-2">
                            Estimated cost per run: <span className="text-orange-400 font-medium">{shopResults.estimatedCostPerUse}</span>
                            {shopResults.budgetUtilization && (
                              <span className="ml-2">({shopResults.budgetUtilization} of budget)</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Workflow Visualization */}
                  {shopResults.workflow && (
                    <div className="p-5 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-lg border border-zinc-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                          <Zap size={16} className="text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{shopResults.workflow.name}</h3>
                          <p className="text-xs text-zinc-400">{shopResults.workflow.description}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-sm font-medium text-orange-400">{shopResults.workflow.estimatedCostPerRun}</p>
                          <p className="text-xs text-zinc-500">{shopResults.workflow.estimatedTime}</p>
                        </div>
                      </div>

                      {/* Workflow Steps */}
                      <div className="relative">
                        {shopResults.workflow.steps?.map((step: any, i: number) => (
                          <div key={step.order} className="flex items-center gap-4 mb-4 last:mb-0">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 bg-orange-500/20 border-2 border-orange-500 rounded-full flex items-center justify-center text-sm font-semibold text-orange-400">
                                {step.order}
                              </div>
                              {i < shopResults.workflow.steps.length - 1 && (
                                <div className="w-0.5 h-8 bg-zinc-700 mt-2"></div>
                              )}
                            </div>
                            <div className="flex-1 bg-zinc-800/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{step.skill_data?.icon || "🔧"}</span>
                                <h4 className="font-medium text-white">{step.skill_data?.name || step.skill}</h4>
                                <Badge className="text-xs">${step.skill_data?.pricePerCall || "0.00"}</Badge>
                              </div>
                              <p className="text-sm text-zinc-300">{step.action}</p>
                              <p className="text-xs text-zinc-500 mt-1">Output: {step.output}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Use Cases */}
                      {shopResults.workflow.useCases?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-700">
                          <p className="text-xs text-zinc-400 mb-2">Perfect for:</p>
                          <div className="flex flex-wrap gap-1">
                            {shopResults.workflow.useCases.map((useCase: string) => (
                              <Badge key={useCase} variant="category" className="text-xs">
                                {useCase}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deploy Button */}
                      <div className="mt-4 pt-4 border-t border-zinc-700">
                        <button
                          onClick={() => {
                            const endpoints = shopResults.workflow.steps.map((s: any) => {
                              const cap = CAPABILITIES.find((c: any) => c.slug === s.skill);
                              return `// Step ${s.order}: ${s.action}\nfetch("${cap?.x402Endpoint || s.skill}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "X-402-Payment": paymentToken },\n  body: JSON.stringify({ input: previousStepOutput })\n});`;
                            }).join('\n\n');
                            navigator.clipboard.writeText(endpoints);
                            alert('✅ Workflow code copied to clipboard!\n\nPaste into your agent to deploy this workflow. Each step calls via x402 — payment is automatic.');
                          }}
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white py-2 rounded-lg font-medium transition-opacity"
                        >
                          Deploy This Workflow — Copy Code
                        </button>
                        <p className="mt-2 text-xs text-zinc-500 text-center">Copies all endpoint calls to clipboard. Paste into your agent.</p>
                      </div>
                    </div>
                  )}

                  {/* Individual Skills */}
                  {shopResults.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-white mb-4">
                        {shopResults.workflow ? "Individual Skills in Workflow:" : "Recommended Skills:"}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {shopResults.recommendations.map((cap) => (
                          <CapabilityCard key={cap.id} capability={cap} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {shopResults.alternatives && shopResults.alternatives.length > 0 && (
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-400 mb-2">💡 Alternative Options:</h4>
                      <ul className="text-sm text-zinc-300 space-y-1">
                        {shopResults.alternatives.map((alt, i) => (
                          <li key={i}>• {alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {shopResults.recommendations.length === 0 && (
                    <p className="text-center text-zinc-500 py-8">
                      No matching skills found within your budget. Try increasing your budget or different keywords.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
