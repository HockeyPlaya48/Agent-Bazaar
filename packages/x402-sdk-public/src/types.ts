// Core x402 SDK Types

export interface AgentConfig {
  walletAddress: string;
  privateKey?: string;
  baseUrl?: string;
}

export interface PaymentResult {
  txHash: string;
  verified: boolean;
  amount: number;
  token: string;
  network: string;
  timestamp: number;
}

export interface Capability {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  type: 'api' | 'cli' | 'skill';
  category: string;
  pricePerCall: number;
  x402Endpoint: string;
  icon: string;
  rating: number;
  usageCount: number;
  featured: boolean;
  tags: string[];
  creatorName: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
}

export interface X402CallOptions {
  paymentToken?: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export interface X402Response<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    skill: string;
    version: string;
    latencyMs: number;
    billedAmount: number;
    paymentVerified: boolean;
  };
}

export interface BuildAgentRequest {
  description: string;
  name?: string;
  platforms?: string[];
}

export interface BuildAgentResponse {
  success: boolean;
  agent: {
    name: string;
    description: string;
    soul_md: string;
    agents_md: string;
    tools_md: string;
    cron_jobs: Array<{
      name: string;
      schedule: string;
      task: string;
    }>;
    recommended_skills: Array<{
      name: string;
      slug: string;
      why: string;
    }>;
    setup_instructions: string;
    collaborators?: string[];
    hiring_budget?: number;
    collaboration_workflow?: string;
  };
  estimated_monthly_cost: string;
  skills_used: number;
}

// Framework Integration Types
export interface LangChainToolConfig {
  name: string;
  description: string;
  schema: Record<string, any>;
}

export interface CrewAIToolConfig {
  name: string;
  description: string;
  func: Function;
}

export interface AutoGenToolConfig {
  name: string;
  description: string;
  callable: Function;
}