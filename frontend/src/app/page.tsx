"use client";

import { useState, useMemo } from "react";
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
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showAgentShop, setShowAgentShop] = useState(false);
  const [shopQuery, setShopQuery] = useState("");
  const [shopLoading, setShopLoading] = useState(false);
  const [shopResults, setShopResults] = useState<{ recommendations: Capability[]; reasoning: string } | null>(null);

  // Use static data directly — always available, no API dependency
  const capabilities = CAPABILITIES;

  const handleAgentShop = async () => {
    if (!shopQuery.trim()) return;
    
    try {
      setShopLoading(true);
      // Call our Next.js API route directly (works on Vercel)
      const res = await fetch("/api/agent-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: shopQuery }),
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
              Deal Marketplace for Agent Skills
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
                <p className="text-2xl font-bold text-white">200+</p>
                <p className="text-sm text-zinc-500">Skills Listed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">4.8M+</p>
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
                    <h2 className="text-2xl font-bold text-white">Let Our AI Find the Right Skills for You</h2>
                    <p className="mt-2 max-w-xl text-zinc-400">
                      Describe what you're building. Our built-in agent will browse the marketplace, compare options, and recommend the best skills — or purchase them on your behalf via x402.
                    </p>
                    <button 
                      onClick={() => setShowAgentShop(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      <Zap size={16} /> Start Agent Shopping
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
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Bot size={20} className="text-orange-400" />
                  </div>
                  <h2 className="text-xl font-bold">AI Agent Shopping</h2>
                </div>
                <button
                  onClick={() => {
                    setShowAgentShop(false);
                    setShopQuery("");
                    setShopResults(null);
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="mt-4 text-zinc-400">
                Describe what you're building or what you need. Our AI will browse the marketplace and recommend the best skills for your project.
              </p>

              <div className="mt-6">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={shopQuery}
                    onChange={(e) => setShopQuery(e.target.value)}
                    placeholder="e.g., I need to build a content pipeline that generates blog posts and optimizes them for SEO"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAgentShop()}
                  />
                  <button
                    onClick={handleAgentShop}
                    disabled={shopLoading || !shopQuery.trim()}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send size={16} />
                    {shopLoading ? "Shopping..." : "Shop"}
                  </button>
                </div>
              </div>

              {shopLoading && (
                <div className="mt-6 text-center py-8">
                  <div className="inline-flex items-center gap-2 text-orange-400">
                    <Bot size={20} className="animate-pulse" />
                    <span>AI is browsing the marketplace...</span>
                  </div>
                </div>
              )}

              {shopResults && (
                <div className="mt-6">
                  <div className="mb-4 p-4 bg-zinc-800/50 rounded-lg">
                    <h3 className="font-semibold mb-2 text-orange-400">AI Recommendation:</h3>
                    <p className="text-sm text-zinc-300">{shopResults.reasoning}</p>
                  </div>

                  {shopResults.recommendations.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {shopResults.recommendations.map((cap) => (
                        <CapabilityCard key={cap.id} capability={cap} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-zinc-500 py-8">
                      No matching skills found. Try a different description or browse our categories.
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
