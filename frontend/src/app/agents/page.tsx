"use client";

import { useState, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";
import { getAgents, type AgentListingAPI } from "@/lib/api";
import { CATEGORIES } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agent-card";
import { CategoryFilter } from "@/components/category-filter";
import { StaggerContainer, StaggerItem, FadeInUp } from "@/components/motion";

export default function BrowseAgents() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [agents, setAgents] = useState<AgentListingAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAgents({
      category: selectedCategory || undefined,
      sort: sortBy === "rating" ? "highest-rated" : sortBy === "price-low" ? "price-low" : sortBy === "price-high" ? "price-high" : "popular",
    })
      .then(setAgents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-3xl font-bold">Browse Agents</h1>
        <p className="mt-1 text-zinc-400">Discover AI agents for every workflow</p>
      </FadeInUp>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          categories={CATEGORIES}
        />
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown size={14} className="text-zinc-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <p className="mt-6 text-sm text-zinc-500">
        {loading ? "Loading..." : `${agents.length} agents found`}
      </p>

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : (
        <StaggerContainer
          key={`${selectedCategory}-${sortBy}`}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {agents.map((agent) => (
            <StaggerItem key={agent.id}>
              <AgentCard agent={agent} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {!loading && agents.length === 0 && (
        <p className="py-12 text-center text-zinc-500">
          No agents found. Try a different category.
        </p>
      )}
    </div>
  );
}
