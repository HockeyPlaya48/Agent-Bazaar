"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserAgents, type AgentListingAPI } from "@/lib/api";

export default function UserDashboard() {
  const [agents, setAgents] = useState<AgentListingAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo user ID — in production this would come from auth
    getUserAgents("demo-user")
      .then(setAgents)
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Loading your agents...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">Agent Bazaar</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm text-zinc-400">My Agents</span>
          </div>
          <Link
            href="/dev"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Developer Portal &rarr;
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">My Agents</h1>
        <p className="mt-1 text-zinc-400">
          {agents.length} agents purchased
        </p>

        {/* Purchased Agents */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{agent.icon}</span>
                <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                  Active
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{agent.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{agent.description}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium hover:bg-zinc-700 transition-colors">
                  Setup Guide
                </button>
                <button className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium hover:bg-zinc-700 transition-colors">
                  API Keys
                </button>
              </div>
              {agent.atlas_compatible && (
                <p className="mt-3 text-[10px] text-blue-400">
                  Atlas-Compatible — upgrade to run autonomously
                </p>
              )}
            </div>
          ))}

          {/* Browse More Card */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-6 text-center hover:border-zinc-500 transition-colors"
          >
            <span className="text-3xl">+</span>
            <p className="mt-2 text-sm text-zinc-400">Browse More Agents</p>
          </Link>
        </div>

        {/* Atlas Upsell */}
        <div className="mt-12 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Upgrade to Atlas</h2>
              <p className="mt-2 text-zinc-400">
                Run all {agents.length} of your agents autonomously
                24/7. They&apos;ll proactively deliver results — no prompts
                needed.
              </p>
            </div>
            <Link
              href="/atlas"
              className="shrink-0 rounded-full bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-400 transition-colors"
            >
              Join Atlas Beta
            </Link>
          </div>
        </div>

        {/* Purchase History */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Purchase History</h2>
          {agents.length > 0 ? (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{agent.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-zinc-500">
                        {agent.price_type === "lifetime"
                          ? "Lifetime access"
                          : "Free"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {agent.price === 0 ? "Free" : `$${agent.price}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-zinc-500">No purchases yet.</p>
              <Link href="/" className="mt-2 inline-block text-sm text-orange-400 hover:text-orange-300 transition-colors">
                Browse Agent Bazaar &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
