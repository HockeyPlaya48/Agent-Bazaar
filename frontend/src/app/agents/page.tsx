"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import { AGENTS, CATEGORIES } from "@/lib/data";
import { AgentCard } from "@/components/agent-card";
import { CategoryFilter } from "@/components/category-filter";
import { StaggerContainer, StaggerItem, FadeInUp } from "@/components/motion";

export default function BrowseAgents() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("popular");

  const agents = useMemo(() => {
    let filtered = selectedCategory
      ? AGENTS.filter((a) => a.category === selectedCategory)
      : [...AGENTS];

    if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
    else filtered.sort((a, b) => b.salesCount - a.salesCount);

    return filtered;
  }, [selectedCategory, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-3xl font-bold">Browse Agents</h1>
        <p className="mt-1 text-zinc-400">Discover AI agents for every workflow</p>
      </FadeInUp>

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

      <p className="mt-6 text-sm text-zinc-500">{agents.length} agents found</p>

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

      {agents.length === 0 && (
        <p className="py-12 text-center text-zinc-500">
          No agents found. Try a different category.
        </p>
      )}
    </div>
  );
}
