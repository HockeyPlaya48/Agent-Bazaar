// Agent Bazaar — Skill Verification & Trust System

export type VerificationStatus = "verified" | "unverified" | "pending" | "failed";
export type TrustLevel = "new" | "rising" | "established" | "trusted" | "elite";

export interface VerificationData {
  status: VerificationStatus;
  verifiedAt?: string;
  lastHealthCheck?: string;
  uptime: number; // percentage 0-100
  avgResponseMs: number;
  totalCalls: number;
  successRate: number; // percentage 0-100
  trustLevel: TrustLevel;
  securityScore: number; // 0-100
  badges: TrustBadge[];
}

export interface TrustBadge {
  id: string;
  label: string;
  icon: string;
  color: string; // tailwind color class
  description: string;
}

// Badge definitions
export const TRUST_BADGES: Record<string, TrustBadge> = {
  verified: {
    id: "verified",
    label: "Verified",
    icon: "✅",
    color: "green",
    description: "Passed automated security and functionality checks",
  },
  highUptime: {
    id: "highUptime",
    label: "99%+ Uptime",
    icon: "🟢",
    color: "emerald",
    description: "Maintains 99%+ uptime over the last 30 days",
  },
  fastResponse: {
    id: "fastResponse",
    label: "Fast",
    icon: "⚡",
    color: "yellow",
    description: "Average response time under 500ms",
  },
  highVolume: {
    id: "highVolume",
    label: "High Volume",
    icon: "🔥",
    color: "orange",
    description: "Over 100K successful calls",
  },
  topRated: {
    id: "topRated",
    label: "Top Rated",
    icon: "⭐",
    color: "yellow",
    description: "4.8+ rating with 50+ reviews",
  },
  securityAudit: {
    id: "securityAudit",
    label: "Audited",
    icon: "🛡️",
    color: "blue",
    description: "Passed manual security audit",
  },
  moneyBack: {
    id: "moneyBack",
    label: "Guaranteed",
    icon: "💰",
    color: "green",
    description: "Money-back guarantee via x402 escrow",
  },
};

// Trust level thresholds
function getTrustLevel(data: { totalCalls: number; uptime: number; successRate: number; rating: number }): TrustLevel {
  const { totalCalls, uptime, successRate, rating } = data;
  if (totalCalls > 500000 && uptime > 99.5 && successRate > 99 && rating >= 4.8) return "elite";
  if (totalCalls > 100000 && uptime > 99 && successRate > 98 && rating >= 4.5) return "trusted";
  if (totalCalls > 10000 && uptime > 95 && successRate > 95) return "established";
  if (totalCalls > 1000) return "rising";
  return "new";
}

// Compute badges for a capability
export function computeBadges(data: {
  uptime: number;
  avgResponseMs: number;
  totalCalls: number;
  successRate: number;
  rating: number;
  verified: boolean;
  audited?: boolean;
}): TrustBadge[] {
  const badges: TrustBadge[] = [];
  if (data.verified) badges.push(TRUST_BADGES.verified);
  if (data.uptime >= 99) badges.push(TRUST_BADGES.highUptime);
  if (data.avgResponseMs < 500) badges.push(TRUST_BADGES.fastResponse);
  if (data.totalCalls > 100000) badges.push(TRUST_BADGES.highVolume);
  if (data.rating >= 4.8) badges.push(TRUST_BADGES.topRated);
  if (data.audited) badges.push(TRUST_BADGES.securityAudit);
  return badges;
}

// Compute full verification data for a capability (using static data for now)
export function getVerificationData(capability: {
  rating: number;
  usageCount: number;
}): VerificationData {
  // Simulate realistic verification data based on usage/rating
  const isHighUsage = capability.usageCount > 50000;
  const uptime = isHighUsage ? 97 + Math.random() * 2.9 : 90 + Math.random() * 8;
  const avgResponseMs = isHighUsage ? 100 + Math.random() * 400 : 200 + Math.random() * 800;
  const successRate = isHighUsage ? 96 + Math.random() * 3.9 : 90 + Math.random() * 8;

  const badges = computeBadges({
    uptime,
    avgResponseMs,
    totalCalls: capability.usageCount,
    successRate,
    rating: capability.rating,
    verified: isHighUsage,
    audited: capability.usageCount > 200000,
  });

  const trustLevel = getTrustLevel({
    totalCalls: capability.usageCount,
    uptime,
    successRate,
    rating: capability.rating,
  });

  return {
    status: isHighUsage ? "verified" : "pending",
    verifiedAt: isHighUsage ? "2026-02-15" : undefined,
    uptime: Math.round(uptime * 10) / 10,
    avgResponseMs: Math.round(avgResponseMs),
    totalCalls: capability.usageCount,
    successRate: Math.round(successRate * 10) / 10,
    trustLevel,
    securityScore: isHighUsage ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 25),
    badges,
  };
}

// Trust level display config
export const TRUST_LEVEL_CONFIG: Record<TrustLevel, { label: string; color: string; icon: string }> = {
  new: { label: "New", color: "zinc", icon: "🆕" },
  rising: { label: "Rising", color: "blue", icon: "📈" },
  established: { label: "Established", color: "purple", icon: "🏛️" },
  trusted: { label: "Trusted", color: "green", icon: "🛡️" },
  elite: { label: "Elite", color: "amber", icon: "👑" },
};
