"use client";

import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import { TRUST_BADGES, TRUST_LEVEL_CONFIG } from "@/lib/verification";
import { FadeInUp, FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

export default function TrustPage() {
  const levels = Object.entries(TRUST_LEVEL_CONFIG) as [string, { label: string; color: string; icon: string }][];
  const badges = Object.values(TRUST_BADGES);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <FadeIn>
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="transition-colors hover:text-white">Agent Bazaar</Link>
          <ChevronRight size={14} />
          <span className="text-zinc-300">Trust & Safety</span>
        </nav>
      </FadeIn>

      <FadeInUp>
        <div className="mt-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Trust & Safety</h1>
            <p className="mt-1 text-zinc-400">How we verify skills and keep the marketplace safe</p>
          </div>
        </div>
      </FadeInUp>

      {/* How Verification Works */}
      <FadeInUp delay={0.1}>
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">How Verification Works</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <p className="text-zinc-400 leading-relaxed">
              Every skill listed on Agent Bazaar goes through our automated verification pipeline. We continuously monitor endpoints for uptime, response time, and correctness to ensure agents and humans can trust what they&apos;re paying for.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { step: "1", title: "Health Checks", desc: "Automated pings every 5 minutes to verify the endpoint is live and responding correctly." },
                { step: "2", title: "Quality Scoring", desc: "Response quality, latency, and success rate are tracked and scored over rolling 30-day windows." },
                { step: "3", title: "Badge Assignment", desc: "Skills that meet thresholds earn trust badges automatically. No pay-to-play — only performance matters." },
              ].map((item) => (
                <div key={item.step} className="rounded-lg bg-zinc-800/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-400 text-sm font-bold mb-2">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <p className="mt-1 text-xs text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInUp>

      {/* Trust Tiers */}
      <FadeInUp delay={0.2}>
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4">Trust Tiers</h2>
          <p className="text-zinc-400 text-sm mb-4">Skills earn trust tiers based on usage volume, uptime, success rate, and user ratings. Higher tiers signal reliability.</p>
          <StaggerContainer className="space-y-3">
            {levels.map(([key, config]) => (
              <StaggerItem key={key}>
                <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{config.label}</h3>
                    <p className="text-xs text-zinc-400">
                      {key === "new" && "Less than 1,000 total calls. Just getting started."}
                      {key === "rising" && "Over 1,000 calls. Gaining traction in the marketplace."}
                      {key === "established" && "Over 10,000 calls with 95%+ uptime and success rate."}
                      {key === "trusted" && "Over 100,000 calls, 99%+ uptime, 98%+ success rate, 4.5+ rating."}
                      {key === "elite" && "Over 500,000 calls, 99.5%+ uptime, 99%+ success rate, 4.8+ rating. The best of the best."}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </FadeInUp>

      {/* Badges */}
      <FadeInUp delay={0.3}>
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4">Trust Badges</h2>
          <p className="text-zinc-400 text-sm mb-4">Badges are earned automatically based on real performance data. Here&apos;s what each one means:</p>
          <StaggerContainer className="grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <StaggerItem key={badge.id}>
                <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <span className="text-xl mt-0.5">{badge.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{badge.label}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{badge.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </FadeInUp>

      {/* Safety Commitment */}
      <FadeInUp delay={0.4}>
        <section className="mt-10 mb-16">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-white">Our Commitment</h2>
            <p className="mt-3 max-w-xl mx-auto text-zinc-400">
              Agent Bazaar is built on transparency. Every badge is earned, every score is real, and every payment is verified through x402. No pay-to-play verification — only performance matters.
            </p>
            <Link
              href="/agents"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Browse Verified Skills
            </Link>
          </div>
        </section>
      </FadeInUp>
    </div>
  );
}
