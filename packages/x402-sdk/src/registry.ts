import type { Capability, CapabilityStats } from "./types";

const DEFAULT_REGISTRY = "https://api.agentbazaar.xyz";

/**
 * Register a new capability with the Agent Bazaar registry.
 * 
 * Publishes a new paid capability to the registry, making it discoverable
 * by AI agents and other consumers. The capability must have a working
 * x402-enabled endpoint that can handle payment validation.
 * 
 * @param capability - Capability metadata (excluding auto-generated fields)
 * @param capability.name - Human-readable name of the capability
 * @param capability.slug - URL-friendly identifier (lowercase, hyphens)
 * @param capability.description - Brief description for discovery
 * @param capability.longDescription - Detailed description with usage info
 * @param capability.type - Capability type ("api", "cli", or "skill")
 * @param capability.category - Category for organization and filtering
 * @param capability.pricePerCall - Price in USD for each invocation
 * @param capability.x402Endpoint - HTTP endpoint that implements x402 protocol
 * @param capability.icon - URL to capability icon/logo
 * @param capability.featured - Whether to feature in the registry
 * @param capability.tags - Array of searchable tags
 * @param capability.creatorName - Name of the capability creator/provider
 * @param registryUrl - Registry API base URL (defaults to production)
 * @returns Promise that resolves to the registered capability with generated ID
 * @throws Error if registration fails due to validation or network issues
 * 
 * @example Register a code review capability
 * ```ts
 * const capability = await registerCapability({
 *   name: "GPT-4 Code Reviewer",
 *   slug: "gpt4-code-review",
 *   description: "AI-powered code review with security and best practices analysis",
 *   longDescription: "Uses GPT-4 to analyze code for bugs, security issues, performance problems, and adherence to best practices. Supports JavaScript, Python, Go, and more.",
 *   type: "api",
 *   category: "code-generation",
 *   pricePerCall: 0.05,
 *   x402Endpoint: "https://myapi.com/code-review",
 *   icon: "https://myapi.com/icon.png",
 *   featured: false,
 *   tags: ["code-review", "gpt4", "security", "javascript", "python"],
 *   creatorName: "CodeReview AI"
 * });
 * 
 * console.log(`Registered with ID: ${capability.id}`);
 * ```
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
 * Retrieve usage statistics and performance metrics for a capability.
 * 
 * Fetches aggregated analytics data for a registered capability, including
 * call volume, success rates, performance metrics, and revenue information.
 * This is useful for capability providers to monitor their service performance.
 * 
 * @param capabilityId - Unique identifier of the capability
 * @param registryUrl - Registry API base URL (defaults to production)
 * @returns Promise that resolves to capability statistics and metrics
 * @throws Error if the capability doesn't exist or request fails
 * 
 * @example Monitor capability performance
 * ```ts
 * const stats = await getCapabilityStats("gpt4-code-review");
 * 
 * console.log(`Total calls: ${stats.totalCalls}`);
 * console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
 * console.log(`Average response time: ${stats.avgLatencyMs}ms`);
 * console.log(`Total revenue: $${stats.totalRevenueUsd}`);
 * console.log(`Last 24h calls: ${stats.last24hCalls}`);
 * ```
 * 
 * @example Set up monitoring dashboard
 * ```ts
 * const capabilities = ["code-review", "image-gen", "data-analysis"];
 * 
 * for (const capId of capabilities) {
 *   const stats = await getCapabilityStats(capId);
 *   console.log(`${capId}: ${stats.totalCalls} calls, $${stats.totalRevenueUsd} revenue`);
 * }
 * ```
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
 * Search for capabilities using text-based queries.
 * 
 * Performs a full-text search across capability names, descriptions, and tags
 * to find relevant paid services. This function provides a simple alternative
 * to the more advanced filtering available through X402Client.discover().
 * 
 * @param query - Text search query (searches names, descriptions, and tags)
 * @param registryUrl - Registry API base URL (defaults to production)
 * @returns Promise that resolves to an array of matching capabilities
 * @throws Error if the search request fails
 * 
 * @example Search for code-related capabilities
 * ```ts
 * const results = await searchCapabilities("code review javascript");
 * 
 * results.forEach(cap => {
 *   console.log(`${cap.name} - $${cap.pricePerCall}`);
 *   console.log(`  ${cap.description}`);
 * });
 * ```
 * 
 * @example Find image generation services
 * ```ts
 * const imageServices = await searchCapabilities("image generation AI art");
 * 
 * // Sort by price
 * imageServices.sort((a, b) => a.pricePerCall - b.pricePerCall);
 * console.log(`Cheapest: ${imageServices[0].name} at $${imageServices[0].pricePerCall}`);
 * ```
 */
export async function searchCapabilities(
  query: string,
  registryUrl = DEFAULT_REGISTRY
): Promise<Capability[]> {
  const res = await fetch(`${registryUrl}/api/capabilities?search=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json() as Promise<Capability[]>;
}
