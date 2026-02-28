import type { Capability, CapabilityStats } from "./types";

const DEFAULT_REGISTRY = "https://api.agentbazaar.xyz";

/**
 * Register a new capability with the Agent Bazaar registry.
 */
export async function registerCapability(
  capability: Omit<Capability, "id" | "rating" | "usageCount">,
  registryUrl = DEFAULT_REGISTRY
): Promise<Capability> {
  const res = await fetch(`${registryUrl}/api/capabilities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(capability),
  });
  if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
  return res.json() as Promise<Capability>;
}

/**
 * Get stats for a capability.
 */
export async function getCapabilityStats(
  capabilityId: string,
  registryUrl = DEFAULT_REGISTRY
): Promise<CapabilityStats> {
  const res = await fetch(`${registryUrl}/api/capabilities/${capabilityId}/stats`);
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return res.json() as Promise<CapabilityStats>;
}

/**
 * Search capabilities by text query.
 */
export async function searchCapabilities(
  query: string,
  registryUrl = DEFAULT_REGISTRY
): Promise<Capability[]> {
  const res = await fetch(`${registryUrl}/api/capabilities?search=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json() as Promise<Capability[]>;
}
