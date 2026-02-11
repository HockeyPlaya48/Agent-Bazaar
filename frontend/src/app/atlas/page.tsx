"use client";

import { useState } from "react";
import Link from "next/link";

export default function AtlasWaitlist() {
  const [email, setEmail] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function toggleGoal(goal: string) {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Save to Supabase with goals for segmentation
    setSubmitted(true);
  }

  const LIFE_GOALS = [
    { label: "Get fit & healthy", icon: "💪", value: "fitness" },
    { label: "Grow my business", icon: "🚀", value: "business" },
    { label: "Create content", icon: "✍️", value: "content" },
    { label: "Save money", icon: "💰", value: "finance" },
    { label: "Generate leads", icon: "🎯", value: "leads" },
    { label: "Learn faster", icon: "🧠", value: "learning" },
    { label: "Build products", icon: "⚡", value: "building" },
    { label: "Stay organized", icon: "📋", value: "productivity" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            &larr; Agent Bazaar
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        {submitted ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-12">
            <span className="text-5xl">🎉</span>
            <h1 className="mt-4 text-3xl font-bold">You&apos;re on the list!</h1>
            <p className="mx-auto mt-4 max-w-md text-zinc-400">
              We&apos;ll notify you when Atlas is ready. Your Agent Bazaar
              purchases will auto-import into your Atlas workspace.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-900 transition-colors"
            >
              Browse More Agents
            </Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="mb-8 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
              Coming Soon
            </div>
            <h1 className="text-4xl font-bold sm:text-5xl">
              Atlas
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Your AI Workforce
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-400">
              Stop managing agents one by one. Atlas runs them all for you,
              24/7. Your agents work proactively and deliver results to your
              Telegram or dashboard — no prompts needed.
            </p>

            {/* Features */}
            <div className="mt-12 grid gap-4 text-left sm:grid-cols-2">
              {[
                {
                  icon: "⚡",
                  title: "Proactive Agents",
                  desc: "Your agents reach out to YOU with completed work",
                },
                {
                  icon: "🤝",
                  title: "Agent Collaboration",
                  desc: "Your content and lead agents coordinate automatically",
                },
                {
                  icon: "🌐",
                  title: "Life-Wide Coverage",
                  desc: "Fitness, finances, content, sales — all handled",
                },
                {
                  icon: "🏢",
                  title: "Virtual Office",
                  desc: "Watch your agents work in a gamified dashboard",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <h3 className="mt-2 font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Waitlist Form */}
            <div className="mt-12 rounded-2xl border border-blue-500/20 bg-zinc-900 p-8">
              <h2 className="text-xl font-bold">Join the Atlas Beta</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Tell us your goals and we&apos;ll match you with the right
                agents.
              </p>

              {/* Life Goals */}
              <div className="mt-6">
                <p className="mb-3 text-sm text-zinc-400">
                  What do you want your agents to help with?
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {LIFE_GOALS.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => toggleGoal(goal.value)}
                      className={`rounded-lg border p-3 text-left text-xs transition-all ${
                        goals.includes(goal.value)
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <span className="text-lg">{goal.icon}</span>
                      <p className="mt-1">{goal.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 rounded-full border border-zinc-700 bg-zinc-800 px-5 py-3 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-400 transition-colors"
                >
                  Join Waitlist
                </button>
              </form>

              <p className="mt-4 text-xs text-zinc-600">
                2,340 people already on the waitlist
              </p>
            </div>

            {/* Bazaar Connection */}
            <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400">
                Already have Agent Bazaar agents? They&apos;ll automatically
                import into your Atlas workspace when you join.
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
              >
                Browse Agent Bazaar →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
