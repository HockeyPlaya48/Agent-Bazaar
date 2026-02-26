// ── Capability Types ──

export type CapabilityType = "api" | "cli" | "skill";

export type CapabilityCategory =
  | "code-generation"
  | "image-generation"
  | "data-analysis"
  | "content-writing"
  | "web-scraping"
  | "trading"
  | "research"
  | "automation"
  | "devops"
  | "media";

export interface Capability {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  type: CapabilityType;
  category: CapabilityCategory;
  pricePerCall: number;
  x402Endpoint: string;
  icon: string;
  rating: number;
  usageCount: number;
  featured: boolean;
  tags: string[];
  creatorName: string;
}

// ── Payment Types ──

export interface PaymentInfo {
  /** Price in USD for a single call */
  priceUsd: number;
  /** Crypto address to pay */
  payTo: string;
  /** Supported networks (e.g. "base", "ethereum") */
  networks: string[];
  /** Supported tokens (e.g. "USDC") */
  tokens: string[];
  /** Human-readable description */
  description: string;
  /** Capability ID */
  capabilityId: string;
}

export interface PaymentToken {
  /** Signed payment proof / transaction hash */
  token: string;
  /** Network used */
  network: string;
  /** Amount in smallest unit */
  amount: string;
  /** Payer address */
  payer: string;
}

export interface X402Response {
  status: 402;
  payment: PaymentInfo;
}

// ── Usage / Stats ──

export interface UsageRecord {
  capabilityId: string;
  timestamp: number;
  latencyMs: number;
  success: boolean;
  payer?: string;
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

// ── Middleware Config ──

export interface X402MiddlewareConfig {
  /** Price per call in USD */
  priceUsd: number;
  /** Crypto address to receive payments */
  payTo: string;
  /** Supported networks */
  networks?: string[];
  /** Supported tokens */
  tokens?: string[];
  /** Capability ID for tracking */
  capabilityId?: string;
  /** Description shown in 402 response */
  description?: string;
  /** Custom payment validator */
  validatePayment?: (token: PaymentToken) => Promise<boolean>;
  /** Called on each successful paid request */
  onPayment?: (token: PaymentToken, req: unknown) => void;
}

// ── Client Config ──

export interface X402ClientConfig {
  /** Base URL of the Agent Bazaar registry */
  registryUrl?: string;
  /** Default payment token to attach */
  paymentToken?: string;
  /** Wallet/signer for automatic payments */
  wallet?: {
    address: string;
    sign: (message: string) => Promise<string>;
  };
}
