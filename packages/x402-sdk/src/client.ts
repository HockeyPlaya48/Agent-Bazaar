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

  /** Get a single capability by ID */
  async get(id: string): Promise<Capability> {
    const res = await fetch(`${this.registryUrl}/api/capabilities/${id}`);
    if (!res.ok) throw new Error(`Capability not found: ${id}`);
    return res.json() as Promise<Capability>;
  }

  /** Get pricing info for a capability (sends empty request, expects 402) */
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
   * Make a paid call to a capability.
   * Automatically attaches payment token and handles 402 responses.
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

  /** Set default payment token */
  setPaymentToken(token: string) {
    this.paymentToken = token;
  }
}
