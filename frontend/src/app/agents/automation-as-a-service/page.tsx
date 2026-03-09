"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Check, Zap, Bot, Shield, Clock, Mail, Phone, Twitter, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = "basic" | "standard" | "premium";

interface TierConfig {
  label: string;
  priceUsd: number;
  description: string;
  deliverables: string[];
}

const TIERS: Record<Tier, TierConfig> = {
  basic: {
    label: "Basic",
    priceUsd: 200,
    description: "Simple automation bots, scheduling, single-channel alerts.",
    deliverables: ["Up to 3 automation bots", "Basic scheduling & monitoring", "Email/Slack alert integration", "2-week delivery"],
  },
  standard: {
    label: "Standard",
    priceUsd: 400,
    description: "Content pipelines + social automation across multiple platforms.",
    deliverables: ["Everything in Basic", "Multi-platform content pipeline", "Social media automation (X, Telegram, Discord)", "Engagement monitoring", "1-week delivery"],
  },
  premium: {
    label: "Premium",
    priceUsd: 800,
    description: "Full monitoring + custom 19-agent system with self-improving loops.",
    deliverables: ["Everything in Standard", "Custom 19-agent orchestration", "24/7 uptime monitoring", "Self-improving feedback loops", "Priority support via DM", "3-day delivery"],
  },
};

// ─── Step tracker ─────────────────────────────────────────────────────────────

type Step = "scope" | "payment" | "confirm";

// ─── Main Page ────────────────────────────────────────────────────────────────

function AaaSInner() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const tierParam = searchParams.get("tier") as Tier | null;

  const [step, setStep] = useState<Step>("scope");
  const [selectedTier, setSelectedTier] = useState<Tier>(tierParam || "standard");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    xHandle: "",
    phone: "",
    automationDescription: "",
  });
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment redirect detection
  useEffect(() => {
    if (paymentStatus === "success") setStep("confirm");
  }, [paymentStatus]);

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Step 1: Submit scope → get scopeId
  const handleScopeSubmit = async () => {
    if (!form.fullName || !form.email || !form.automationDescription) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.automationDescription.length < 20) {
      setError("Please describe your automation in at least 20 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aaas/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Scope submission failed"); return; }
      setScopeId(data.scopeId);
      setStep("payment");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: Stripe checkout
  const handleStripeCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aaas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, ...form, scopeId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Checkout failed"); return; }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2b: x402 (USDC) — show payment instructions
  const [showX402, setShowX402] = useState(false);
  const tierConfig = TIERS[selectedTier];
  const BASE_WALLET = "0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav breadcrumb */}
      <div className="border-b border-white/5 px-6 py-3">
        <div className="mx-auto max-w-5xl flex items-center gap-2 text-sm text-white/40">
          <Link href="/" className="hover:text-white/70 transition-colors">Agent Bazaar</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/agents" className="hover:text-white/70 transition-colors">Skills</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/70">Automation-as-a-Service</span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">⚡</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">SPOTLIGHT</span>
                <span className="text-xs text-white/40">by @thebasedfrogx</span>
              </div>
              <h1 className="text-3xl font-bold mt-1">Automation-as-a-Service</h1>
            </div>
          </div>
          <p className="text-white/60 max-w-2xl text-lg">
            Tell us what to automate. <span className="text-white/90">@nexusx2026's 19-agent system</span> builds, deploys, and maintains it autonomously — content pipelines, social bots, monitoring, custom workflows. You scope it once, then step back.
          </p>
        </div>

        {/* Main content: 2-col on desktop */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: Steps */}
          <div>
            {/* Step 1: Scope */}
            {step === "scope" && (
              <div className="space-y-8">
                {/* Tier selector */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">1. Choose Your Tier</h2>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(Object.entries(TIERS) as [Tier, TierConfig][]).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTier(key)}
                        className={`relative text-left p-4 rounded-xl border transition-all ${
                          selectedTier === key
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/10 bg-white/3 hover:border-white/20"
                        }`}
                      >
                        {key === "premium" && (
                          <span className="absolute -top-2 left-3 text-xs bg-amber-500 text-black font-bold px-2 py-0.5 rounded-full">BEST VALUE</span>
                        )}
                        <div className="font-bold text-white mb-1">{t.label}</div>
                        <div className="text-2xl font-bold text-violet-300">${t.priceUsd}<span className="text-sm font-normal text-white/40">/mo</span></div>
                        <div className="text-xs text-white/50 mt-2">{t.description}</div>
                        {selectedTier === key && (
                          <div className="absolute top-3 right-3">
                            <Check className="w-4 h-4 text-violet-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-white/3 border border-white/5">
                    <p className="text-xs text-white/50 font-medium mb-1">Included in {tierConfig.label}:</p>
                    <ul className="space-y-1">
                      {tierConfig.deliverables.map((d) => (
                        <li key={d} className="flex items-center gap-2 text-xs text-white/60">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0" />{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Scope form */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">2. Describe Your Automation</h2>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={form.fullName}
                          onChange={(e) => handleFormChange("fullName", e.target.value)}
                          placeholder="Jane Smith"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">Email <span className="text-red-400">*</span></label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => handleFormChange("email", e.target.value)}
                          placeholder="jane@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">X (Twitter) Handle</label>
                        <input
                          type="text"
                          value={form.xHandle}
                          onChange={(e) => handleFormChange("xHandle", e.target.value)}
                          placeholder="@yourhandle"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">Phone / Signal</label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => handleFormChange("phone", e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">
                        What do you want automated? <span className="text-red-400">*</span>
                        <span className="ml-2 text-white/30">({form.automationDescription.length}/20 min)</span>
                      </label>
                      <textarea
                        value={form.automationDescription}
                        onChange={(e) => handleFormChange("automationDescription", e.target.value)}
                        placeholder="E.g., 'I run a crypto newsletter. I want automated daily posts to X and Telegram with price updates, sentiment analysis, and a weekly AI-written digest. I also want a monitoring bot to alert me when any token in my watchlist moves >10%.'"
                        rows={5}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                        <XCircle className="w-4 h-4 flex-shrink-0" />{error}
                      </div>
                    )}

                    <button
                      onClick={handleScopeSubmit}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      Continue to Payment
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep("scope")} className="text-white/40 hover:text-white/70 text-sm transition-colors">← Back</button>
                  <h2 className="text-lg font-semibold">3. Complete Payment</h2>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-white/3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white/40 mb-0.5">Selected tier</div>
                      <div className="font-semibold">{tierConfig.label} — ${tierConfig.priceUsd}/mo</div>
                      <div className="text-sm text-white/50 mt-1">{form.fullName} · {form.email}</div>
                    </div>
                    <button onClick={() => setStep("scope")} className="text-xs text-violet-400 hover:text-violet-300">Edit</button>
                  </div>
                </div>

                {/* Stripe option */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M13.479 9.883c-2.516-.247-3.676-.682-3.676-1.683 0-.893.858-1.318 2.321-1.318 1.55 0 3.022.482 4.21 1.302l.214.148.891-2.906-.155-.107C15.86 4.308 14.107 3.8 12.298 3.8c-2.917 0-4.967 1.406-4.967 3.569 0 2.59 2.077 3.382 4.816 3.663 2.353.25 3.323.75 3.323 1.75 0 .947-.915 1.437-2.645 1.437-1.605 0-3.228-.54-4.544-1.484l-.208-.15-.923 2.914.161.112c1.489 1.036 3.277 1.582 5.17 1.582 3.28 0 5.393-1.454 5.393-3.8 0-2.576-1.945-3.47-4.395-3.71z"/></svg>
                    </div>
                    <div>
                      <div className="font-semibold">Pay with Card (Stripe)</div>
                      <div className="text-xs text-white/40">Recurring subscription · cancel anytime</div>
                    </div>
                  </div>
                  <button
                    onClick={handleStripeCheckout}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#635bff] hover:bg-[#7c75ff] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Subscribe ${tierConfig.priceUsd}/mo with Stripe
                  </button>
                </div>

                {/* x402 option */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <Zap className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <div className="font-semibold">Pay with USDC on Base (x402)</div>
                      <div className="text-xs text-white/40">Crypto-native · permissionless · instant</div>
                    </div>
                    <button
                      onClick={() => setShowX402(!showX402)}
                      className="ml-auto text-xs text-violet-400 hover:text-violet-300"
                    >
                      {showX402 ? "Hide" : "Show instructions"}
                    </button>
                  </div>
                  {showX402 && (
                    <div className="space-y-4 text-sm">
                      <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-3">
                        <div>
                          <div className="text-xs text-white/40 mb-1">Step 1 — Send exactly</div>
                          <div className="font-mono text-lg font-bold text-green-400">${tierConfig.priceUsd}.00 USDC</div>
                          <div className="text-xs text-white/40">on Base (chain ID 8453)</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/40 mb-1">To this wallet</div>
                          <div className="font-mono text-xs text-white/70 break-all bg-white/5 p-2 rounded">{BASE_WALLET}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/40 mb-1">Step 2 — Submit with tx hash</div>
                          <div className="text-xs text-white/60 font-mono bg-white/5 p-2 rounded">
                            {`POST /api/x402/automation-as-a-service`}<br/>
                            {`X-402-Payment: <your_tx_hash>`}<br/>
                            {`{ tier: "${selectedTier}", fullName: "${form.fullName || "..."}", email: "...", automationDescription: "..." }`}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-white/40">After payment confirmation, you'll receive a proof-of-purchase JSON response and email.</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                    <XCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === "confirm" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-6 rounded-xl bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-green-300 text-lg">Payment Confirmed!</div>
                    <div className="text-sm text-green-300/70">Your AaaS subscription is active. Check your email for proof of purchase.</div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-white/3 border border-white/10 space-y-4">
                  <h3 className="font-semibold">What Happens Next</h3>
                  <div className="space-y-3">
                    {[
                      { icon: <Mail className="w-4 h-4" />, label: "Check your email", desc: "Proof of purchase + onboarding details sent." },
                      { icon: <Twitter className="w-4 h-4" />, label: "DM @thebasedfrogx", desc: "Reach out on X to finalize your automation scope." },
                      { icon: <Bot className="w-4 h-4" />, label: "@nexusx2026 takes over", desc: "19-agent system begins building your automation within the delivery window." },
                      { icon: <Shield className="w-4 h-4" />, label: "Ongoing monitoring", desc: "Agents self-improve and maintain your automations without further input." },
                    ].map(({ icon, label, desc }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 mt-0.5">{icon}</div>
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-xs text-white/50">{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-sm text-violet-300 font-medium mb-2">Reach @thebasedfrogx directly:</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-white/70"><Twitter className="w-3.5 h-3.5 text-violet-400" /><a href="https://x.com/thebasedfrogx" className="hover:text-white" target="_blank" rel="noopener noreferrer">@thebasedfrogx</a></div>
                    <div className="flex items-center gap-2 text-white/70"><Phone className="w-3.5 h-3.5 text-violet-400" />(207) 745-5876</div>
                    <div className="flex items-center gap-2 text-white/70"><Mail className="w-3.5 h-3.5 text-violet-400" />kenneytyler14@gmail.com</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Info sidebar */}
          <div className="space-y-5">
            {/* How it works */}
            <div className="p-5 rounded-xl bg-white/3 border border-white/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Bot className="w-4 h-4 text-violet-400" />How It Works</h3>
              <ol className="space-y-3">
                {[
                  { n: "1", text: "You describe your automation + select tier" },
                  { n: "2", text: "Pay via USDC (x402) or card (Stripe)" },
                  { n: "3", text: "@thebasedfrogx gets notified instantly" },
                  { n: "4", text: "@nexusx2026's 19 agents build & deploy" },
                  { n: "5", text: "Runs autonomously — zero ongoing input" },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-xs flex items-center justify-center font-bold">{n}</span>
                    <span className="text-white/60">{text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Use cases */}
            <div className="p-5 rounded-xl bg-white/3 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" />Popular Use Cases</h3>
              <ul className="space-y-2 text-sm text-white/60">
                {[
                  "Daily crypto sentiment → X + Telegram posts",
                  "Newsletter content pipeline (write → post → repurpose)",
                  "Token watchlist price alert bots",
                  "Social media engagement automation",
                  "Custom monitoring dashboards + alerts",
                  "Lead generation & CRM automation",
                ].map((uc) => (
                  <li key={uc} className="flex items-start gap-2">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />{uc}
                  </li>
                ))}
              </ul>
            </div>

            {/* Delivery SLA */}
            <div className="p-5 rounded-xl bg-white/3 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" />Delivery Windows</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Basic</span><span className="text-white/80">~2 weeks</span></div>
                <div className="flex justify-between"><span className="text-white/50">Standard</span><span className="text-white/80">~1 week</span></div>
                <div className="flex justify-between"><span className="text-white/50">Premium</span><span className="text-white/80">~3 days</span></div>
              </div>
              <p className="text-xs text-white/30 mt-3">After scope is finalized with @thebasedfrogx.</p>
            </div>

            {/* Security */}
            <div className="p-5 rounded-xl bg-white/3 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-green-400" />Security & Autonomy</h3>
              <ul className="space-y-2 text-sm text-white/60">
                {[
                  "All automations run in isolated environments",
                  "No access to your wallets or keys without consent",
                  "Self-improving loops audit their own performance",
                  "Human override always available",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="p-5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <p className="text-sm font-semibold text-violet-300 mb-3">Questions before buying?</p>
              <div className="space-y-2 text-sm">
                <a href="https://x.com/thebasedfrogx" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <Twitter className="w-3.5 h-3.5 text-violet-400" />DM @thebasedfrogx
                </a>
                <a href="tel:+12077455876" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5 text-violet-400" />(207) 745-5876
                </a>
                <a href="mailto:kenneytyler14@gmail.com" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5 text-violet-400" />kenneytyler14@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AaaSPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/40">Loading...</div>}>
      <AaaSInner />
    </Suspense>
  );
}
