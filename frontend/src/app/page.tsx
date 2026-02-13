"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAgents, getBundles, type AgentListingAPI, type BundleAPI } from "@/lib/api";
import { CATEGORIES } from "@/lib/data";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-xs">
      {"★".repeat(Math.floor(rating))}
      <span className="text-zinc-600">{"★".repeat(5 - Math.floor(rating))}</span>
    </span>
  );
}

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Loading Agent Bazaar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Agent Bazaar
            </Link>
            <div className="hidden items-center gap-4 text-sm text-zinc-400 sm:flex">
              <Link href="/agents" className="hover:text-white transition-colors">Browse</Link>
              <Link href="/bundles" className="hover:text-white transition-colors">Bundles</Link>
              <Link href="/dev" className="hover:text-white transition-colors">For Developers</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/atlas"
              className="hidden text-sm text-blue-400 hover:text-blue-300 transition-colors sm:block"
            >
              Atlas Beta →
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-32 pb-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-400">
            Deal Marketplace for AI Agents
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-6xl">
            Discover AI Agents.
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Lifetime Deals.
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-400">
            Browse pre-built AI agents for productivity, marketing, finance, and
            more. One-time purchase. No code. Deploy in minutes.
          </p>

          {/* Search */}
          <div className="mx-auto max-w-lg">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents (e.g., email, SEO, fitness)..."
              className="w-full rounded-full border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 pb-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-white text-black"
                : "border border-zinc-700 text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.value ? null : cat.value
                )
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? "bg-white text-black"
                  : "border border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Deals */}
      {!search && !selectedCategory && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-2xl font-bold">Today&apos;s Deals</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredAgents.map((agent) => (
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
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                    {agent.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <StarRating rating={agent.rating} />
                    <span className="text-xs text-zinc-600">
                      ({agent.review_count})
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {agent.price === 0 ? "Free" : `$${agent.price}`}
                    </span>
                    {agent.original_price > 0 && agent.price > 0 && (
                      <span className="text-sm text-zinc-500 line-through">
                        ${agent.original_price}
                      </span>
                    )}
                    {agent.price_type === "lifetime" && agent.price > 0 && (
                      <span className="text-xs text-green-400">lifetime</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bundles */}
      {!search && !selectedCategory && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-2xl font-bold">Bundles — Save Big</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.map((bundle) => (
                <Link
                  key={bundle.id}
                  href={`/bundles`}
                  className="group rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 transition-all hover:border-orange-500/40"
                >
                  <div className="flex items-center gap-2">
                    {bundle.agents.map((a) => (
                      <span key={a.id} className="text-2xl">
                        {a.icon}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{bundle.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {bundle.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-2xl font-bold">${bundle.price}</span>
                    <span className="text-sm text-zinc-500 line-through">
                      ${bundle.original_price}
                    </span>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                      {Math.round(
                        (1 - bundle.price / bundle.original_price) * 100
                      )}
                      % off
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-blue-400">
                    {bundle.atlas_hint}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Agents */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 text-2xl font-bold">
            {search
              ? `Results for "${search}"`
              : selectedCategory
              ? CATEGORIES.find((c) => c.value === selectedCategory)?.label
              : "All Agents"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAgents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-600"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{agent.icon}</span>
                  <div className="flex gap-1">
                    {agent.atlas_compatible && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                        Atlas
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mt-3 font-semibold group-hover:text-orange-400 transition-colors">
                  {agent.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                  {agent.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <StarRating rating={agent.rating} />
                  <span className="text-xs text-zinc-600">
                    ({agent.review_count})
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-bold">
                    {agent.price === 0 ? "Free" : `$${agent.price}`}
                  </span>
                  {agent.original_price > 0 && agent.price > 0 && (
                    <span className="text-xs text-zinc-500 line-through">
                      ${agent.original_price}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-zinc-600">
                  by {agent.developer_name} · {agent.sales_count.toLocaleString()}{" "}
                  sales
                </p>
              </Link>
            ))}
          </div>
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
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Want these agents running autonomously 24/7?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Atlas turns your Agent Bazaar purchases into a proactive AI
              workforce. No prompts needed.
            </p>
            <Link
              href="/atlas"
              className="mt-6 inline-block rounded-full bg-blue-500 px-8 py-3 font-medium text-white hover:bg-blue-400 transition-colors"
            >
              Join Atlas Beta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-sm text-zinc-500">
            Agent Bazaar &copy; {new Date().getFullYear()}
          </span>
          <div className="flex gap-4 text-sm text-zinc-500">
            <Link href="/dev" className="hover:text-white transition-colors">Developers</Link>
            <Link href="/atlas" className="hover:text-white transition-colors">Atlas</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
