import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AgentShoppingCtaProps {
  skillCount?: number;
  variant?: "section" | "inline";
}

export function AtlasCta({ skillCount, variant = "section" }: AgentShoppingCtaProps) {
  if (variant === "inline") {
    return (
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
        <h3 className="font-semibold text-blue-400">
          Perfect for x402-enabled agents
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          This skill integrates seamlessly with any x402-compatible agent framework.
          Pay per use, no subscriptions.
        </p>
        <Link
          href="/atlas"
          className="mt-3 inline-block text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Learn about Agent Shopping &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 text-center sm:p-12">
      <h2 className="text-2xl font-bold sm:text-3xl">
        {skillCount
          ? `Let AI find the perfect skills from ${skillCount}+ capabilities`
          : "Let AI discover the skills you need"}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-zinc-400">
        Agent Shopping uses AI to match your project needs with the right x402 skills.
        Describe what you're building, get personalized recommendations.
      </p>
      <div className="mt-6">
        <Link href="/atlas">
          <Button variant="atlas" size="lg">
            {skillCount ? "Try Agent Shopping" : "Start Shopping"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
