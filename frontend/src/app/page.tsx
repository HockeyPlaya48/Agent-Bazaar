"use client";

import { useState, useMemo } from "react";
import { Search, Rocket, Zap } from "lucide-react";
import Link from "next/link";
import { AGENTS, BUNDLES, CATEGORIES } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AgentCard } from "@/components/agent-card";
import { BundleCard } from "@/components/bundle-card";
import { SectionHeader } from "@/components/section-header";
import { CategoryFilter } from "@/components/category-filter";
import { AtlasCta } from "@/components/atlas-cta";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

const featuredAgents = AGENTS.filter((a) => a.featured);

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredAgents = useMemo(() => {
    return AGENTS.filter((agent) => {
      const matchesSearch =
        !search ||
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.tags.some((t) => t.includes(search.toLowerCase()));
      const matchesCategory =
        !selectedCategory || agent.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <div>
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-16">
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[500px] w-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <FadeInUp>
            <Badge variant="deal" className="px-4 py-1.5 text-sm">
              Deal Marketplace for AI Agents
            </Badge>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <h1 className="mt-6 text-5xl font-bold leading-tight sm:text-7xl">
              Discover AI Agents.
              <br />
              <span className="gradient-text-orange">Monthly Plans.</span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              Browse pre-built AI agents for productivity, marketing, finance, and more.
              Affordable monthly plans. No code. Deploy in minutes.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.3}>
            <div className="mx-auto mt-8 max-w-lg">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents (e.g., email, SEO, fitness)..."
                icon={<Search size={18} />}
                className="rounded-full py-3.5"
              />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <div className="mx-auto mt-8 flex max-w-md justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">180+</p>
                <p className="text-sm text-zinc-500">Agents</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">12k+</p>
                <p className="text-sm text-zinc-500">Deployments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">4.7★</p>
                <p className="text-sm text-zinc-500">Avg Rating</p>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            <h2 className="mb-8 text-center text-2xl font-bold text-white">How It Works</h2>
          </FadeInUp>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: <Search size={28} />, title: "Browse", desc: "Find the perfect agent for your use case" },
              { icon: <Rocket size={28} />, title: "Deploy", desc: "One-click setup, no code required" },
              { icon: <Zap size={28} />, title: "Automate", desc: "Your agent works 24/7 while you grow" },
            ].map((step, i) => (
              <FadeInUp key={step.title} delay={i * 0.1}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
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

      {/* Featured Deals */}
      {!search && !selectedCategory && featuredAgents.length > 0 && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title="Today's Deals" />
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredAgents.map((agent) => (
                <StaggerItem key={agent.id}>
                  <AgentCard agent={agent} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Bundles */}
      {!search && !selectedCategory && BUNDLES.length > 0 && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="Bundles — Save Big"
              action={{ label: "View All", href: "/bundles" }}
            />
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BUNDLES.map((bundle) => (
                <StaggerItem key={bundle.id}>
                  <BundleCard bundle={bundle} compact />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* All Agents */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={
              search
                ? `Results for "${search}"`
                : selectedCategory
                ? CATEGORIES.find((c) => c.value === selectedCategory)?.label || "Agents"
                : "All Agents"
            }
            action={!search && !selectedCategory ? { label: "Browse All", href: "/agents" } : undefined}
          />
          <StaggerContainer
            key={`${search}-${selectedCategory}`}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredAgents.map((agent) => (
              <StaggerItem key={agent.id}>
                <AgentCard agent={agent} />
              </StaggerItem>
            ))}
          </StaggerContainer>
          {filteredAgents.length === 0 && (
            <p className="py-12 text-center text-zinc-500">
              No agents found. Try a different search or category.
            </p>
          )}
        </div>
      </section>

      {/* Atlas CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            <AtlasCta />
          </FadeInUp>
        </div>
      </section>

      {/* Creator CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            <div className="rounded-2xl border border-transparent bg-zinc-900 p-8 text-center" style={{ borderImage: "linear-gradient(135deg, #f97316, #a855f7) 1" }}>
              <h2 className="text-3xl font-bold text-white">Built an AI Agent? Sell It Here.</h2>
              <p className="mx-auto mt-3 max-w-lg text-zinc-400">
                Join 50+ creators earning passive income. Keep 80% of every sale.
              </p>
              <Link
                href="/dev"
                className="mt-6 inline-block rounded-full bg-gradient-to-r from-orange-500 to-purple-500 px-8 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Become a Creator
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>
    </div>
  );
}
