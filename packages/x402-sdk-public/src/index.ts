export { X402Client } from './client';
export * from './types';

import { X402Client } from './client';
import { AgentConfig, X402CallOptions, X402Response } from './types';

/**
 * Create a new x402 client instance
 */
export function createX402Client(config: AgentConfig): X402Client {
  return new X402Client(config);
}

/**
 * Quick pay-and-call function for one-off usage
 */
export async function payAndCall<T = any>(
  config: AgentConfig,
  slug: string,
  payload: Record<string, any>,
  paymentAmount: number
): Promise<X402Response<T>> {
  const client = new X402Client(config);
  return client.payAndCall<T>(slug, payload, paymentAmount);
}

/**
 * Discover skills shorthand
 */
export async function discoverSkills(
  config: AgentConfig,
  query?: string
) {
  const client = new X402Client(config);
  return client.discover(query);
}

/**
 * Verify payment shorthand
 */
export async function verifyPayment(
  config: AgentConfig,
  txHash: string,
  capabilityId: string
) {
  const client = new X402Client(config);
  return client.verifyPayment(txHash, capabilityId);
}

// Framework integrations
export { createLangChainTool } from './integrations/langchain';
export { createCrewAITool } from './integrations/crewai';
export { createAutoGenTool } from './integrations/autogen';
export { createOpenClawSkill } from './integrations/openclaw';