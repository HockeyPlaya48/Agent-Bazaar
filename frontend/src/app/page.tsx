"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { getAgents, getBundles, type AgentListingAPI, type BundleAPI } from "@/lib/api";
import { CATEGORIES } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agent-card";
import { BundleCard } from "@/components/bundle-card";
import { SectionHeader } from "@/components/section-header";
import { CategoryFilter } from "@/components/category-filter";
import { AtlasCta } from "@/components/atlas-cta";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentListingAPI[]>([]);
  const [bundles, setBundles] = useState<BundleAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAgents(), getBundles()])
      .then(([agentsData, bundlesData]) => {
        setAgents(agentsData);
        setBundles(bundlesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      !search ||
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.tags.some((t) => t.includes(search.toLowerCase()));
    const matchesCategory =
      !selectedCategory || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredAgents = agents.filter((a) => a.featured);

  if (loading) {
    return (
      <div className="px-6 pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <Skeleton className="mx-auto h-8 w-48" />
            <Skeleton className="mx-auto mt-6 h-16 w-96" />
            <Skeleton className="mx-auto mt-4 h-12 w-full max-w-lg" />
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-16">
        {/* Radial glow */}
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
              <span className="gradient-text-orange">Lifetime Deals.</span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              Browse pre-built AI agents for productivity, marketing, finance, and
              more. One-time purchase. No code. Deploy in minutes.
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
      {!search && !selectedCategory && bundles.length > 0 && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="Bundles — Save Big"
              action={{ label: "View All", href: "/bundles" }}
            />
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.map((bundle) => (
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
    </div>
  );
}
