export interface CapabilityRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  type: "api" | "cli" | "skill";
  category: string;
  pricePerCall: number;
  x402Endpoint: string;
  icon: string;
  rating: number;
  usageCount: number;
  featured: boolean;
  tags: string[];
  creatorName: string;
}

export interface UsageEvent {
  capabilityId: string;
  timestamp: number;
  latencyMs: number;
  success: boolean;
  amountUsd: number;
}

export interface CapabilityStats {
  capabilityId: string;
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  totalRevenueUsd: number;
  last24hCalls: number;
}
