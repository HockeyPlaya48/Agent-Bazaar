"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Users, Globe, Monitor, Check } from "lucide-react";
import { joinWaitlist } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FadeInUp, StaggerContainer, StaggerItem, ScaleOnHover } from "@/components/motion";

export default function AtlasWaitlist() {
  const [email, setEmail] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleGoal(goal: string) {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await joinWaitlist(email, goals);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const LIFE_GOALS = [
    { label: "Get fit & healthy", icon: "\u{1F4AA}", value: "fitness" },
    { label: "Grow my business", icon: "\u{1F680}", value: "business" },
    { label: "Create content", icon: "\u270D\uFE0F", value: "content" },
    { label: "Save money", icon: "\u{1F4B0}", value: "finance" },
    { label: "Generate leads", icon: "\u{1F3AF}", value: "leads" },
    { label: "Learn faster", icon: "\u{1F9E0}", value: "learning" },
    { label: "Build products", icon: "\u26A1", value: "building" },
    { label: "Stay organized", icon: "\u{1F4CB}", value: "productivity" },
  ];

  const FEATURES = [
    { icon: Zap, title: "Proactive Agents", desc: "Your agents reach out to YOU with completed work" },
    { icon: Users, title: "Agent Collaboration", desc: "Your content and lead agents coordinate automatically" },
    { icon: Globe, title: "Life-Wide Coverage", desc: "Fitness, finances, content, sales — all handled" },
    { icon: Monitor, title: "Virtual Office", desc: "Watch your agents work in a gamified dashboard" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      {submitted ? (
        <FadeInUp>
          <Card className="p-12 border-green-500/20 bg-green-500/5">
            <span className="text-5xl">🎉</span>
            <h1 className="mt-4 text-3xl font-bold">You&apos;re on the list!</h1>
            <p className="mx-auto mt-4 max-w-md text-zinc-400">
              We&apos;ll notify you when Atlas is ready. Your Agent Bazaar
              purchases will auto-import into your Atlas workspace.
            </p>
            <Link href="/">
              <Button variant="secondary" size="lg" className="mt-8">
                Browse More Agents
              </Button>
            </Link>
          </Card>
        </FadeInUp>
      ) : (
        <>
          {/* Hero with blue glow */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center -top-32">
              <div className="h-[400px] w-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)]" />
            </div>

            <FadeInUp>
              <Badge variant="atlas" className="px-4 py-1.5 text-sm">
                Coming Soon
              </Badge>
            </FadeInUp>

            <FadeInUp delay={0.1}>
              <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
                Atlas
                <br />
                <span className="gradient-text-blue">Your AI Workforce</span>
              </h1>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-400">
                Stop managing agents one by one. Atlas runs them all for you,
                24/7. Your agents work proactively and deliver results to your
                Telegram or dashboard — no prompts needed.
              </p>
            </FadeInUp>
          </div>

          {/* Features */}
          <StaggerContainer className="mt-12 grid gap-4 text-left sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card className="p-5">
                  <feature.icon size={24} className="text-blue-400" />
                  <h3 className="mt-2 font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{feature.desc}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Signup Form */}
          <FadeInUp delay={0.3}>
            <Card className="mt-12 border-blue-500/20 bg-zinc-900 p-8">
              <h2 className="text-xl font-bold">Join the Atlas Beta</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Tell us your goals and we&apos;ll match you with the right agents.
              </p>

              <div className="mt-6">
                <p className="mb-3 text-sm text-zinc-400">What do you want your agents to help with?</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {LIFE_GOALS.map((goal) => (
                    <ScaleOnHover key={goal.value}>
                      <button
                        onClick={() => toggleGoal(goal.value)}
                        className={`relative w-full rounded-xl border p-3 text-left text-xs transition-all duration-200 ${
                          goals.includes(goal.value)
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        {goals.includes(goal.value) && (
                          <div className="absolute top-2 right-2">
                            <Check size={12} className="text-blue-400" />
                          </div>
                        )}
                        <span className="text-lg">{goal.icon}</span>
                        <p className="mt-1">{goal.label}</p>
                      </button>
                    </ScaleOnHover>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="rounded-full"
                />
                <Button
                  type="submit"
                  variant="atlas"
                  size="lg"
                  loading={submitting}
                >
                  Join Waitlist
                </Button>
              </form>
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </Card>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <Card className="mt-8 p-6">
              <p className="text-sm text-zinc-400">
                Already have Agent Bazaar agents? They&apos;ll automatically
                import into your Atlas workspace when you join.
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-medium text-orange-400 transition-colors hover:text-orange-300"
              >
                Browse Agent Bazaar &rarr;
              </Link>
            </Card>
          </FadeInUp>
        </>
      )}
    </div>
  );
}
