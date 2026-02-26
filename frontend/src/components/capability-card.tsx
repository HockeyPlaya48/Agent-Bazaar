"use client";

import { Capability } from "@/types";
import { Badge } from "@/components/ui/badge";

const typeStyles: Record<string, { label: string; className: string }> = {
  api: { label: "API", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  cli: { label: "CLI", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  skill: { label: "Skill", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

function formatUsage(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function CapabilityCard({ capability }: { capability: Capability }) {
  const t = typeStyles[capability.type] || typeStyles.api;

  return (
    <div className="group relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{capability.icon}</span>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${t.className}`}>
          {t.label}
        </span>
      </div>

      <h3 className="mt-3 text-[15px] font-semibold text-white group-hover:text-orange-400 transition-colors">
        {capability.name}
      </h3>

      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-zinc-400">
        {capability.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">
            ${capability.pricePerCall.toFixed(capability.pricePerCall < 0.01 ? 3 : 2)}
            <span className="text-[11px] font-normal text-zinc-500">/call</span>
          </span>
          <span className="text-[11px] text-zinc-500">
            {formatUsage(capability.usageCount)} uses
          </span>
        </div>
        <div className="flex items-center gap-1 text-[12px]">
          <span className="text-yellow-500">★</span>
          <span className="text-zinc-300">{capability.rating}</span>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {capability.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
