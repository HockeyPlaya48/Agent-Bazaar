import type {
  Capability,
  X402ClientConfig,
  X402Response,
  PaymentToken,
} from "./types";

const DEFAULT_REGISTRY = "https://api.agentbazaar.xyz";

/**
 * Agent-side client for discovering and interacting with paid capabilities.
 * 
 * The X402Client provides a high-level interface for AI agents and applications
 * to discover, evaluate, and call paid capabilities in the Agent Bazaar ecosystem.
 * It handles payment token management, 402 response processing, and provides
 * convenient methods for capability discovery and execution.
 * 
 * @example Basic usage
 * ```ts
 * import { X402Client } from "@agent-bazaar/x402-sdk";
 *
 * const client = new X402Client({ 
 *   registryUrl: "https://api.agentbazaar.xyz",
 *   paymentToken: "your-payment-proof-token"
 * });
 * 
 * // Discover capabilities by category
 * const codeCapabilities = await client.discover({ category: "code-generation" });
 * 
 * // Make a paid call
 * const result = await client.call(codeCapabilities[0].id, { 
 *   code: "function hello() { return 'world'; }" 
 * });
 * ```
 * 
 * @example Error handling for unpaid requests
 * ```ts
 * try {
 *   const result = await client.call("capability-id", payload);
 * } catch (error) {
 *   if (error.status === 402) {
 *     console.log("Payment required:", error.payment);
 *     // Handle payment flow
 *   }
 * }
 * ```
 */
export class X402Client {
  private registryUrl: string;
  private paymentToken?: string;

  /**
   * Creates a new X402Client instance.
   * 
   * @param config - Configuration options for the client
   * @param config.registryUrl - Base URL of the Agent Bazaar registry API
   * @param config.paymentToken - Default payment token to attach to requests
   * @param config.wallet - Wallet configuration for automatic payment signing
   */
  constructor(config: X402ClientConfig = {}) {
    this.registryUrl = (config.registryUrl || DEFAULT_REGISTRY).replace(/\/$/, "");
    this.paymentToken = config.paymentToken;
  }

  /**
   * Discover capabilities in the Agent Bazaar registry.
   * 
   * Search and filter available capabilities by category, text search, or type.
   * This method is useful for agents to find relevant paid services they can integrate.
   * 
   * @param params - Search and filter parameters
   * @param params.category - Filter by capability category (e.g., "code-generation", "image-generation")
   * @param params.search - Text search query to match capability names and descriptions
   * @param params.type - Filter by capability type ("api", "cli", or "skill")
   * @returns Promise that resolves to an array of matching capabilities
   * 
   * @example Discover by category
   * ```ts
   * const codeCapabilities = await client.discover({ 
   *   category: "code-generation" 
   * });
   * ```
   * 
   * @example Search by text
   * ```ts
   * const reviewCapabilities = await client.discover({ 
   *   search: "code review" 
   * });
   * ```
   * 
   * @example Multiple filters
   * ```ts
   * const apiCapabilities = await client.discover({ 
   *   category: "data-analysis", 
   *   type: "api" 
   * });
   * ```
   */
  async discover(params?: {
    category?: string;
    search?: string;
    type?: string;
  }): Promise<Capability[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    if (params?.type) query.set("type", params.type);
    const qs = query.toString();
    const res = await fetch(`${this.registryUrl}/api/capabilities${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error(`Registry error: ${res.status}`);
    return res.json() as Promise<Capability[]>;
  }

  /**
   * Retrieve detailed information about a specific capability.
   * 
   * Fetches complete metadata for a capability including pricing, description,
   * usage statistics, and integration details.
   * 
   * @param id - Unique identifier of the capability
   * @returns Promise that resolves to the capability details
   * @throws Error if the capability is not found or request fails
   * 
   * @example
   * ```ts
   * const capability = await client.get("code-review-gpt4");
   * console.log(`${capability.name}: $${capability.pricePerCall} per call`);
   * console.log(`Rating: ${capability.rating}/5 (${capability.usageCount} uses)`);
   * ```
   */
  async get(id: string): Promise<Capability> {
    const res = await fetch(`${this.registryUrl}/api/capabilities/${id}`);
    if (!res.ok) throw new Error(`Capability not found: ${id}`);
    return res.json() as Promise<Capability>;
  }

  /**
   * Get pricing information for a capability by probing its endpoint.
   * 
   * Sends an empty POST request to the capability's endpoint to trigger a 402
   * Payment Required response, which contains detailed payment information
   * including price, supported networks, and payment addresses.
   * 
   * @param endpointOrId - Either a capability ID or direct HTTP endpoint URL
   * @returns Promise that resolves to payment information from the 402 response
   * @throws Error if the endpoint doesn't return a 402 response as expected
   * 
   * @example With capability ID
   * ```ts
   * const payment = await client.pricing("code-review-gpt4");
   * console.log(`Price: $${payment.priceUsd}`);
   * console.log(`Pay to: ${payment.payTo}`);
   * console.log(`Networks: ${payment.networks.join(", ")}`);
   * ```
   * 
   * @example With direct endpoint URL
   * ```ts
   * const payment = await client.pricing("https://myapi.com/ai-service");
   * ```
   */
  async pricing(endpointOrId: string): Promise<X402Response["payment"]> {
    const url = endpointOrId.startsWith("http")
      ? endpointOrId
      : `${this.registryUrl}/api/capabilities/${endpointOrId}/call`;
    const res = await fetch(url, { method: "POST" });
    if (res.status === 402) {
      const body = (await res.json()) as X402Response;
      return body.payment;
    }
    throw new Error(`Expected 402, got ${res.status}`);
  }

  /**
   * Execute a paid call to a capability with automatic payment handling.
   * 
   * This is the primary method for invoking paid capabilities. It automatically
   * attaches payment tokens from the client configuration or method options,
   * handles 402 Payment Required responses by surfacing payment details, and
   * returns the capability's response upon successful payment verification.
   * 
   * @template T - Expected return type of the capability response
   * @param capabilityId - Unique identifier of the capability to call
   * @param payload - Request payload to send to the capability
   * @param options - Call-specific options
   * @param options.paymentToken - Override the default payment token for this call
   * @returns Promise that resolves to the capability's response
   * @throws Error with status 402 and payment details if payment is required/invalid
   * @throws Error for other HTTP errors (network issues, server errors, etc.)
   * 
   * @example Basic usage with default payment token
   * ```ts
   * const client = new X402Client({ paymentToken: "your-token" });
   * const result = await client.call("code-review-gpt4", {
   *   code: "function add(a, b) { return a + b; }",
   *   language: "javascript"
   * });
   * console.log(result.review);
   * ```
   * 
   * @example Override payment token for specific call
   * ```ts
   * const result = await client.call("image-gen-dalle", {
   *   prompt: "A sunset over mountains"
   * }, { 
   *   paymentToken: "special-high-limit-token" 
   * });
   * ```
   * 
   * @example Handling payment required errors
   * ```ts
   * try {
   *   const result = await client.call("capability-id", payload);
   * } catch (error) {
   *   if (error.status === 402) {
   *     console.log("Payment required:");
   *     console.log(`Price: $${error.payment.priceUsd}`);
   *     console.log(`Pay to: ${error.payment.payTo}`);
   *     // Implement payment flow
   *   }
   * }
   * ```
   */
  async call<T = unknown>(
    capabilityId: string,
    payload: unknown,
    options?: { paymentToken?: string }
  ): Promise<T> {
    const token = options?.paymentToken || this.paymentToken;
    const url = `${this.registryUrl}/api/capabilities/${capabilityId}/call`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["X-402-Payment"] = token;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    // Auto-handle 402: surface payment info
    if (res.status === 402) {
      const body = (await res.json()) as X402Response;
      const err: any = new Error("Payment required");
      err.status = 402;
      err.payment = body.payment;
      throw err;
    }

    if (!res.ok) throw new Error(`Call failed: ${res.status}`);
    return res.json() as Promise<T>;
  }

  /**
   * Update the default payment token for this client instance.
   * 
   * Changes the payment token that will be automatically attached to all
   * subsequent capability calls. This is useful for switching between
   * different payment accounts or updating tokens when they expire.
   * 
   * @param token - New payment token to use as default
   * 
   * @example
   * ```ts
   * const client = new X402Client();
   * 
   * // Set initial payment token
   * client.setPaymentToken("payment-proof-token-abc123");
   * 
   * // Make calls with this token
   * await client.call("capability-1", payload);
   * 
   * // Update to a new token
   * client.setPaymentToken("new-payment-token-xyz789");
   * 
   * // Subsequent calls use the new token
   * await client.call("capability-2", payload);
   * ```
   */
  setPaymentToken(token: string) {
    this.paymentToken = token;
  }
}
