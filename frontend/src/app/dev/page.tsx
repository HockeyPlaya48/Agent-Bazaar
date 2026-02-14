"use client";

import { useState } from "react";
import { User, DollarSign, ShoppingCart, Star, CheckCircle } from "lucide-react";
import { getDevStats, getDevAgents, submitAgent, type AgentListingAPI, type DevStatsAPI, type AgentSubmitAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeInUp, FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

export default function DevPortal() {
  const [tab, setTab] = useState<"dashboard" | "submit">("dashboard");
  const [devName, setDevName] = useState("");
  const [stats, setStats] = useState<DevStatsAPI | null>(null);
  const [agents, setAgents] = useState<AgentListingAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [looked, setLooked] = useState(false);

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
    <div className="mx-auto max-w-6xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-2xl font-bold">Developer Portal</h1>
        <p className="mt-1 text-zinc-400">
          List your AI agents, set pricing, and earn revenue.
        </p>
      </FadeInUp>

      {/* Dev Name Input */}
      <FadeInUp delay={0.1}>
        <div className="mt-6 flex gap-3">
          <Input
            value={devName}
            onChange={(e) => setDevName(e.target.value)}
            placeholder="Enter your developer name"
            icon={<User size={16} />}
          />
          <Button
            variant="primary"
            size="lg"
            onClick={loadDashboard}
            loading={loading}
            disabled={!devName.trim()}
          >
            Load Dashboard
          </Button>
        </div>
      </FadeInUp>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl bg-zinc-900/50 p-1 w-fit">
        <button
          onClick={() => setTab("dashboard")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            tab === "dashboard" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTab("submit")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            tab === "submit" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Submit Agent
        </button>
      </div>

      {tab === "dashboard" && (
        <>
          {!looked && (
            <p className="mt-8 text-sm text-zinc-500">
              Enter your developer name above to see your stats.
            </p>
          )}

          {looked && loading && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          )}

          {looked && !loading && stats && (
            <>
              <StaggerContainer className="mt-8 grid gap-4 sm:grid-cols-3">
                <StaggerItem>
                  <Card>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-400" />
                      <p className="text-xs text-zinc-500">Total Revenue</p>
                    </div>
                    <p className="mt-2 text-3xl font-bold">${stats.total_revenue.toLocaleString()}</p>
                    <p className="text-xs text-zinc-400">Across {stats.agent_count} agents</p>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card>
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={16} className="text-blue-400" />
                      <p className="text-xs text-zinc-500">Total Sales</p>
                    </div>
                    <p className="mt-2 text-3xl font-bold">{stats.total_sales}</p>
                    <p className="text-xs text-zinc-400">Across {stats.agent_count} agents</p>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card>
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-yellow-400" />
                      <p className="text-xs text-zinc-500">Avg Rating</p>
                    </div>
                    <p className="mt-2 text-3xl font-bold">{stats.avg_rating.toFixed(1)}</p>
                    <p className="text-yellow-400 text-xs">{"★".repeat(Math.floor(stats.avg_rating))}</p>
                  </Card>
                </StaggerItem>
              </StaggerContainer>

              <div className="mt-8">
                <h2 className="mb-4 text-lg font-semibold">Your Agents</h2>
                {agents.length > 0 ? (
                  <StaggerContainer className="space-y-3">
                    {agents.map((agent) => (
                      <StaggerItem key={agent.id}>
                        <Card className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{agent.icon}</span>
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-xs text-zinc-500">
                                {agent.sales_count} sales &middot; ${agent.price} per sale
                              </p>
                            </div>
                          </div>
                          <Badge variant="success">live</Badge>
                        </Card>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                ) : (
                  <p className="text-sm text-zinc-500">No agents listed yet. Submit your first agent!</p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {tab === "submit" && (
        <FadeIn>
          <form onSubmit={handleSubmit} className="mt-8 max-w-xl">
            <h2 className="text-lg font-semibold">Submit a New Agent</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Fill in the details. Our team reviews submissions within 48 hours.
            </p>

            {submitSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400">
                <CheckCircle size={18} />
                Agent submitted successfully! It will appear after review.
              </div>
            )}

            <div className="mt-6 space-y-4">
              <Input
                label="Agent Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Email Outreach Agent"
                required
              />
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                options={[
                  { value: "", label: "Select category" },
                  { value: "productivity", label: "Productivity" },
                  { value: "marketing", label: "Marketing" },
                  { value: "personal", label: "Personal" },
                  { value: "ecommerce", label: "E-commerce" },
                  { value: "dev-tools", label: "Dev Tools" },
                  { value: "finance", label: "Finance" },
                ]}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does your agent do?"
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Price ($)"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="49"
                />
                <Select
                  label="Price Type"
                  value={form.price_type}
                  onChange={(e) => setForm({ ...form, price_type: e.target.value })}
                  options={[
                    { value: "lifetime", label: "Lifetime Deal" },
                    { value: "monthly", label: "Monthly" },
                    { value: "free", label: "Free" },
                  ]}
                />
              </div>
              <Input
                label="Demo URL (Telegram bot link)"
                type="url"
                value={form.demo_url}
                onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
                placeholder="https://t.me/YourDemoBot"
              />
              <Select
                label="Install Type"
                value={form.install_type}
                onChange={(e) => setForm({ ...form, install_type: e.target.value })}
                options={[
                  { value: "api", label: "API" },
                  { value: "telegram", label: "Telegram Bot" },
                  { value: "zapier", label: "Zapier" },
                  { value: "nocode", label: "No-Code" },
                  { value: "custom", label: "Custom" },
                ]}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="atlas"
                  checked={form.atlas_compatible}
                  onChange={(e) => setForm({ ...form, atlas_compatible: e.target.checked })}
                  className="rounded border-zinc-700"
                />
                <label htmlFor="atlas" className="text-sm text-zinc-400">
                  This agent is Atlas-Compatible (supports autonomous orchestration)
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                Submit for Review
              </Button>
            </div>
          </form>
        </FadeIn>
      )}
    </div>
  );
}
