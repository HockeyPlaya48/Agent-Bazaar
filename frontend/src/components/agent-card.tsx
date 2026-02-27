import Link from "next/link";
import { type Capability } from "@/types";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";

interface AgentCardProps {
  agent: Capability;
}

/** @deprecated Use CapabilityCard instead */
export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900/80 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] block"
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{agent.icon}</span>
        <div className="flex gap-1.5">
          {agent.featured && <Badge variant="deal">Featured</Badge>}
        </div>
      </div>
      <h3 className="mt-3 font-semibold transition-colors group-hover:text-orange-400">
        {agent.name}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
        {agent.description}
      </p>
      <div className="mt-3">
        <StarRating rating={agent.rating} count={agent.usageCount} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-bold">${agent.pricePerCall}/call</span>
      </div>
      <p className="mt-1.5 text-[10px] text-zinc-600">
        by {agent.creatorName} &middot;{" "}
        {agent.usageCount.toLocaleString()} calls
      </p>
    </Link>
  );
}
