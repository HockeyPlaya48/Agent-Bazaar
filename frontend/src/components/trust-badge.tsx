"use client";

import { VerificationData, TRUST_LEVEL_CONFIG, TrustBadge as TrustBadgeType } from "@/lib/verification";

const colorMap: Record<string, string> = {
  green: "bg-green-500/10 text-green-400 border-green-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  zinc: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

export function TrustBadge({ badge }: { badge: TrustBadgeType }) {
  const colors = colorMap[badge.color] || colorMap.zinc;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors}`}
      title={badge.description}
    >
      {badge.icon} {badge.label}
    </span>
  );
}

export function TrustBadgeRow({ badges, max = 4 }: { badges: TrustBadgeType[]; max?: number }) {
  const shown = badges.slice(0, max);
  const extra = badges.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((b) => (
        <TrustBadge key={b.id} badge={b} />
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-zinc-500">+{extra} more</span>
      )}
    </div>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/30 px-2.5 py-1 text-xs font-semibold text-green-400">
        ✅ Verified
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 text-xs font-semibold text-yellow-400">
        ⏳ Pending Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 border border-zinc-500/30 px-2.5 py-1 text-xs font-semibold text-zinc-400">
      ⚠️ Unverified
    </span>
  );
}

export function TrustScoreCard({ data }: { data: VerificationData }) {
  const level = TRUST_LEVEL_CONFIG[data.trustLevel];
  const levelColors = colorMap[level.color] || colorMap.zinc;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Trust & Verification</h3>
        <VerificationBadge status={data.status} />
      </div>

      {/* Trust Level */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${levelColors}`}>
          {level.icon} {level.label} Provider
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <div className="text-[11px] text-zinc-500 mb-1">Uptime</div>
          <div className={`text-lg font-bold ${data.uptime >= 99 ? "text-green-400" : data.uptime >= 95 ? "text-yellow-400" : "text-red-400"}`}>
            {data.uptime}%
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <div className="text-[11px] text-zinc-500 mb-1">Avg Response</div>
          <div className={`text-lg font-bold ${data.avgResponseMs < 500 ? "text-green-400" : data.avgResponseMs < 1000 ? "text-yellow-400" : "text-red-400"}`}>
            {data.avgResponseMs}ms
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <div className="text-[11px] text-zinc-500 mb-1">Success Rate</div>
          <div className={`text-lg font-bold ${data.successRate >= 99 ? "text-green-400" : data.successRate >= 95 ? "text-yellow-400" : "text-red-400"}`}>
            {data.successRate}%
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <div className="text-[11px] text-zinc-500 mb-1">Security Score</div>
          <div className={`text-lg font-bold ${data.securityScore >= 80 ? "text-green-400" : data.securityScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>
            {data.securityScore}/100
          </div>
        </div>
      </div>

      {/* Badges */}
      {data.badges.length > 0 && (
        <div>
          <div className="text-[11px] text-zinc-500 mb-2">Earned Badges</div>
          <TrustBadgeRow badges={data.badges} max={6} />
        </div>
      )}
    </div>
  );
}
