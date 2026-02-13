"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAgents, type AgentListingAPI } from "@/lib/api";
import { CATEGORIES } from "@/lib/data";

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
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-xl font-bold">Agent Bazaar</Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-400">Browse</span>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                !selectedCategory ? "bg-white text-black" : "border border-zinc-700 text-zinc-400"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat.value ? "bg-white text-black" : "border border-zinc-700 text-zinc-400"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ml-auto rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Results */}
        <p className="mt-6 text-sm text-zinc-500">
          {loading ? "Loading..." : `${agents.length} agents found`}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.slug}`}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-600"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{agent.icon}</span>
                {agent.atlas_compatible && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                    Atlas
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold group-hover:text-orange-400 transition-colors">
                {agent.name}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{agent.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-yellow-400 text-xs">{"★".repeat(Math.floor(agent.rating))}</span>
                <span className="text-xs text-zinc-600">({agent.review_count})</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-bold">{agent.price === 0 ? "Free" : `$${agent.price}`}</span>
                {agent.original_price > 0 && agent.price > 0 && (
                  <span className="text-xs text-zinc-500 line-through">${agent.original_price}</span>
                )}
              </div>
              <p className="mt-1 text-[10px] text-zinc-600">
                by {agent.developer_name} · {agent.sales_count.toLocaleString()} sales
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
