import { listCapabilities, getCapability, getCapabilityBySlug, addCapability, getStats, recordUsage } from "./store";
import type { CapabilityRecord } from "./schema";

type Req = { method: string; url: string; headers: Record<string, string>; body?: any };
type Res = { status: number; body: any };

/**
 * Pure-function route handler — works with any HTTP framework.
 * Returns { status, body } for the given request.
 */
export function handleRequest(req: Req): Res {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const method = req.method.toUpperCase();

  // GET /api/capabilities
  if (method === "GET" && path === "/api/capabilities") {
    const category = url.searchParams.get("category") || undefined;
    const type = url.searchParams.get("type") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const results = listCapabilities({ category, type, search });
    return { status: 200, body: results };
  }

  // GET /api/capabilities/:id/stats
  const statsMatch = path.match(/^\/api\/capabilities\/([^/]+)\/stats$/);
  if (method === "GET" && statsMatch) {
    const stats = getStats(statsMatch[1]);
    return { status: 200, body: stats };
  }

  // POST /api/capabilities/:id/call — proxy paid call
  const callMatch = path.match(/^\/api\/capabilities\/([^/]+)\/call$/);
  if (method === "POST" && callMatch) {
    const cap = getCapability(callMatch[1]) || getCapabilityBySlug(callMatch[1]);
    if (!cap) return { status: 404, body: { error: "Capability not found" } };

    const paymentToken = req.headers["x-402-payment"] || req.headers["x-payment-token"];
    if (!paymentToken) {
      return {
        status: 402,
        body: {
          status: 402,
          payment: {
            priceUsd: cap.pricePerCall,
            payTo: "0xAgentBazaarTreasury",
            networks: ["base"],
            tokens: ["USDC"],
            description: cap.name,
            capabilityId: cap.id,
          },
        },
      };
    }

    // Record usage
    const start = Date.now();
    recordUsage({
      capabilityId: cap.id,
      timestamp: start,
      latencyMs: 50,
      success: true,
      amountUsd: cap.pricePerCall,
    });

    return {
      status: 200,
      body: {
        result: `[stub] ${cap.name} called successfully`,
        capabilityId: cap.id,
        billed: cap.pricePerCall,
      },
    };
  }

  // GET /api/capabilities/:id
  const idMatch = path.match(/^\/api\/capabilities\/([^/]+)$/);
  if (method === "GET" && idMatch) {
    const cap = getCapability(idMatch[1]) || getCapabilityBySlug(idMatch[1]);
    if (!cap) return { status: 404, body: { error: "Capability not found" } };
    return { status: 200, body: cap };
  }

  // POST /api/capabilities
  if (method === "POST" && path === "/api/capabilities") {
    const record = addCapability(req.body);
    return { status: 201, body: record };
  }

  return { status: 404, body: { error: "Not found" } };
}
