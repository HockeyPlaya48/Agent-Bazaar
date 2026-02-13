"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDevStats, getDevAgents, submitAgent, type AgentListingAPI, type DevStatsAPI, type AgentSubmitAPI } from "@/lib/api";

export default function DevPortal() {
  const [tab, setTab] = useState<"dashboard" | "submit">("dashboard");
  const [devName, setDevName] = useState("");
  const [stats, setStats] = useState<DevStatsAPI | null>(null);
  const [agents, setAgents] = useState<AgentListingAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [looked, setLooked] = useState(false);

  // Submit form state
  const [form, setForm] = useState<AgentSubmitAPI>({
    name: "",
    category: "",
    description: "",
    price: 0,
    price_type: "lifetime",
    demo_url: "",
    install_type: "api",
    atlas_compatible: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  function loadDashboard() {
    if (!devName.trim()) return;
    setLoading(true);
    setLooked(true);
    Promise.all([getDevStats(devName), getDevAgents(devName)])
      .then(([s, a]) => {
        setStats(s);
        setAgents(a);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(false);
    try {
      await submitAgent({ ...form, developer_name: devName } as AgentSubmitAPI & { developer_name: string });
      setSubmitSuccess(true);
      setForm({ name: "", category: "", description: "", price: 0, price_type: "lifetime", demo_url: "", install_type: "api", atlas_compatible: false });
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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

        {/* Developer Name Lookup */}
        <div className="mt-6 flex gap-3">
          <input
            type="text"
            value={devName}
            onChange={(e) => setDevName(e.target.value)}
            placeholder="Enter your developer name"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
          />
          <button
            onClick={loadDashboard}
            disabled={loading || !devName.trim()}
            className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-400 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load Dashboard"}
          </button>
        </div>

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
            {!looked && (
              <p className="mt-8 text-sm text-zinc-500">Enter your developer name above and click Load Dashboard to see your stats.</p>
            )}

            {looked && !loading && stats && (
              <>
                {/* Stats */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <p className="text-xs text-zinc-500">Total Revenue</p>
                    <p className="mt-1 text-3xl font-bold">${stats.total_revenue.toLocaleString()}</p>
                    <p className="text-xs text-zinc-400">Across {stats.agent_count} agents</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <p className="text-xs text-zinc-500">Total Sales</p>
                    <p className="mt-1 text-3xl font-bold">{stats.total_sales}</p>
                    <p className="text-xs text-zinc-400">Across {stats.agent_count} agents</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <p className="text-xs text-zinc-500">Avg Rating</p>
                    <p className="mt-1 text-3xl font-bold">{stats.avg_rating.toFixed(1)}</p>
                    <p className="text-yellow-400 text-xs">{"★".repeat(Math.floor(stats.avg_rating))}</p>
                  </div>
                </div>

                {/* Agent List */}
                <div className="mt-8">
                  <h2 className="mb-4 text-lg font-semibold">Your Agents</h2>
                  {agents.length > 0 ? (
                    <div className="space-y-3">
                      {agents.map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{agent.icon}</span>
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-xs text-zinc-500">
                                {agent.sales_count} sales · ${agent.price} per sale
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                            live
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">No agents listed yet. Submit your first agent!</p>
                  )}
                </div>
              </>
            )}

            {looked && loading && (
              <p className="mt-8 text-sm text-zinc-500 animate-pulse">Loading your stats...</p>
            )}
          </>
        )}

        {tab === "submit" && (
          <form onSubmit={handleSubmit} className="mt-8 max-w-xl">
            <h2 className="text-lg font-semibold">Submit a New Agent</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Fill in the details. Our team reviews submissions within 48 hours.
            </p>

            {submitSuccess && (
              <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400">
                Agent submitted successfully! It will appear after review.
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs text-zinc-500">Agent Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Email Outreach Agent"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                >
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
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does your agent do?"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-500">Price ($)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="49"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Price Type</label>
                  <select
                    value={form.price_type}
                    onChange={(e) => setForm({ ...form, price_type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  >
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
                  value={form.demo_url}
                  onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
                  placeholder="https://t.me/YourDemoBot"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Install Type</label>
                <select
                  value={form.install_type}
                  onChange={(e) => setForm({ ...form, install_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="api">API</option>
                  <option value="telegram">Telegram Bot</option>
                  <option value="zapier">Zapier</option>
                  <option value="nocode">No-Code</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="atlas"
                  checked={form.atlas_compatible}
                  onChange={(e) => setForm({ ...form, atlas_compatible: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="atlas" className="text-sm text-zinc-400">
                  This agent is Atlas-Compatible (supports autonomous orchestration)
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-orange-500 py-3 font-medium text-white hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
