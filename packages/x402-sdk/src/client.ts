import type {
  Capability,
  X402ClientConfig,
  X402Response,
  PaymentToken,
} from "./types";

const DEFAULT_REGISTRY = "https://api.agentbazaar.xyz";

/**
 * Agent-side client for discovering and paying for capabilities.
 *
 * ```ts
 * import { X402Client } from "@agent-bazaar/x402-sdk";
 *
 * const client = new X402Client({ registryUrl: "http://localhost:4002" });
 * const caps = await client.discover({ category: "code-generation" });
 * const result = await client.call(caps[0].id, { code: "..." });
 * ```
 */
export class X402Client {
  private registryUrl: string;
  private paymentToken?: string;

  constructor(config: X402ClientConfig = {}) {
    this.registryUrl = (config.registryUrl || DEFAULT_REGISTRY).replace(/\/$/, "");
    this.paymentToken = config.paymentToken;
  }

  /** Discover capabilities by category, search, or type */
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
    return res.json();
  }

  /** Get a single capability by ID */
  async get(id: string): Promise<Capability> {
    const res = await fetch(`${this.registryUrl}/api/capabilities/${id}`);
    if (!res.ok) throw new Error(`Capability not found: ${id}`);
    return res.json();
  }

  /** Get pricing info for a capability (sends empty request, expects 402) */
  async pricing(endpointOrId: string): Promise<X402Response["payment"]> {
    const url = endpointOrId.startsWith("http")
      ? endpointOrId
      : `${this.registryUrl}/api/capabilities/${endpointOrId}/call`;
    const res = await fetch(url, { method: "POST" });
    if (res.status === 402) {
      const body = await res.json();
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
      const body = await res.json();
      const err: any = new Error("Payment required");
      err.status = 402;
      err.payment = body.payment;
      throw err;
    }

    if (!res.ok) throw new Error(`Call failed: ${res.status}`);
    return res.json();
  }

  /** Set default payment token */
  setPaymentToken(token: string) {
    this.paymentToken = token;
  }
}
