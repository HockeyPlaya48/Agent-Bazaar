import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AtlasCtaProps {
  agentCount?: number;
  variant?: "section" | "inline";
}

export function AtlasCta({ agentCount, variant = "section" }: AtlasCtaProps) {
  if (variant === "inline") {
    return (
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
        <h3 className="font-semibold text-blue-400">
          This agent works with Atlas
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          Purchase this agent and upgrade to Atlas to have it run autonomously
          24/7 — no prompts needed.
        </p>
        <Link
          href="/atlas"
          className="mt-3 inline-block text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Learn about Atlas &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 text-center sm:p-12">
      <h2 className="text-2xl font-bold sm:text-3xl">
        {agentCount
          ? `Run all ${agentCount} of your agents autonomously 24/7`
          : "Want these agents running autonomously 24/7?"}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-zinc-400">
        Atlas turns your Agent Bazaar purchases into a proactive AI workforce.
        No prompts needed.
      </p>
      <div className="mt-6">
        <Link href="/atlas">
          <Button variant="atlas" size="lg">
            {agentCount ? "Upgrade to Atlas" : "Join Atlas Beta"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
