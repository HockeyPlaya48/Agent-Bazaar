"use client";

import { useState } from "react";
import Link from "next/link";

export default function DevPortal() {
  const [tab, setTab] = useState<"dashboard" | "submit">("dashboard");

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">Agent Bazaar</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm text-zinc-400">Developer Portal</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">Developer Portal</h1>
        <p className="mt-1 text-zinc-400">
          List your AI agents, set pricing, and earn revenue.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg bg-zinc-900 p-1 w-fit">
          <button
            onClick={() => setTab("dashboard")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "dashboard" ? "bg-zinc-800 text-white" : "text-zinc-400"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab("submit")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "submit" ? "bg-zinc-800 text-white" : "text-zinc-400"
            }`}
          >
            Submit Agent
          </button>
        </div>

        {tab === "dashboard" && (
          <>
            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <p className="text-xs text-zinc-500">Total Revenue</p>
                <p className="mt-1 text-3xl font-bold">$2,340</p>
                <p className="text-xs text-green-400">+12% this month</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <p className="text-xs text-zinc-500">Total Sales</p>
                <p className="mt-1 text-3xl font-bold">47</p>
                <p className="text-xs text-zinc-400">Across 3 agents</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <p className="text-xs text-zinc-500">Avg Rating</p>
                <p className="mt-1 text-3xl font-bold">4.6</p>
                <p className="text-yellow-400 text-xs">★★★★★</p>
              </div>
            </div>

            {/* Agent List */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold">Your Agents</h2>
              <div className="space-y-3">
                {[
                  { name: "Email Outreach Agent", sales: 32, revenue: 2528, status: "live" },
                  { name: "Calendar Optimizer", sales: 12, revenue: 588, status: "live" },
                  { name: "SEO Blog Writer", sales: 3, revenue: 177, status: "live" },
                  { name: "Lead Qualifier Bot", sales: 0, revenue: 0, status: "draft" },
                ].map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-xs text-zinc-500">
                        {agent.sales} sales · ${agent.revenue} revenue
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        agent.status === "live"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button className="mt-6 rounded-full bg-orange-500 px-6 py-3 font-medium text-white hover:bg-orange-400 transition-colors">
              Request Payout
            </button>
          </>
        )}

        {tab === "submit" && (
          <div className="mt-8 max-w-xl">
            <h2 className="text-lg font-semibold">Submit a New Agent</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Fill in the details. Our team reviews submissions within 48 hours.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs text-zinc-500">Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g., Email Outreach Agent"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Category</label>
                <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
                  <option value="">Select category</option>
                  <option value="productivity">Productivity</option>
                  <option value="marketing">Marketing</option>
                  <option value="personal">Personal</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="dev-tools">Dev Tools</option>
                  <option value="finance">Finance</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Description</label>
                <textarea
                  rows={3}
                  placeholder="What does your agent do?"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-500">Price ($)</label>
                  <input
                    type="number"
                    placeholder="49"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Price Type</label>
                  <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
                    <option value="lifetime">Lifetime Deal</option>
                    <option value="monthly">Monthly</option>
                    <option value="free">Free</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500">
                  Demo URL (Telegram bot link)
                </label>
                <input
                  type="url"
                  placeholder="https://t.me/YourDemoBot"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Install Type</label>
                <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
                  <option value="api">API</option>
                  <option value="telegram">Telegram Bot</option>
                  <option value="zapier">Zapier</option>
                  <option value="nocode">No-Code</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="atlas" className="rounded" />
                <label htmlFor="atlas" className="text-sm text-zinc-400">
                  This agent is Atlas-Compatible (supports autonomous
                  orchestration)
                </label>
              </div>

              <button className="w-full rounded-full bg-orange-500 py-3 font-medium text-white hover:bg-orange-400 transition-colors">
                Submit for Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
