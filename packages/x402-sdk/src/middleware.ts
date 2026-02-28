import type { X402MiddlewareConfig, PaymentToken, PaymentInfo, UsageRecord } from "./types";

// In-memory usage log (provider-side)
const usageLog: UsageRecord[] = [];

/**
 * Express/Connect-style middleware that gates an endpoint behind x402 payment.
 * 
 * This middleware intercepts incoming requests and checks for payment tokens. If no valid
 * payment token is provided, it returns a 402 Payment Required response with payment 
 * information. Only requests with valid payments proceed to the next middleware/handler.
 *
 * @param config - Configuration options for the payment middleware
 * @param config.priceUsd - Price per request in USD
 * @param config.payTo - Crypto address to receive payments
 * @param config.networks - Supported blockchain networks (default: ["base"])
 * @param config.tokens - Supported payment tokens (default: ["USDC"])
 * @param config.capabilityId - Unique identifier for tracking (default: "unknown")
 * @param config.description - Human-readable description for 402 responses
 * @param config.validatePayment - Custom payment validation function
 * @param config.onPayment - Callback executed on successful payments
 * 
 * @returns Express middleware function that enforces payment requirements
 * 
 * @example
 * ```ts
 * import express from "express";
 * import { x402 } from "@agent-bazaar/x402-sdk";
 *
 * const app = express();
 * app.post("/api/code-review", 
 *   x402({ 
 *     priceUsd: 0.05, 
 *     payTo: "0x742d35Cc6634C0532925a3b8D42319d8c",
 *     capabilityId: "code-review-v1"
 *   }), 
 *   (req, res) => {
 *     // Your protected logic here
 *     res.json({ review: "Code looks good!" });
 *   }
 * );
 * ```
 */
export function x402(config: X402MiddlewareConfig) {
  const {
    priceUsd,
    payTo,
    networks = ["base"],
    tokens = ["USDC"],
    capabilityId = "unknown",
    description = "Payment required",
    validatePayment,
    onPayment,
  } = config;

  return async (req: any, res: any, next: any) => {
    const start = Date.now();
    const paymentHeader = req.headers["x-402-payment"] || req.headers["x-payment-token"];

    // No payment token → return 402 with payment info
    if (!paymentHeader) {
      const payment: PaymentInfo = {
        priceUsd,
        payTo,
        networks,
        tokens,
        description,
        capabilityId,
      };
      res.status(402).json({ status: 402, payment });
      return;
    }

    // Parse payment token
    let token: PaymentToken;
    try {
      token = typeof paymentHeader === "string" ? JSON.parse(paymentHeader) : paymentHeader;
    } catch {
      // Simple token string — wrap it
      token = {
        token: paymentHeader as string,
        network: networks[0],
        amount: String(priceUsd),
        payer: "unknown",
      };
    }

    // Validate payment
    const isValid = validatePayment ? await validatePayment(token) : defaultValidate(token);
    if (!isValid) {
      res.status(402).json({
        status: 402,
        error: "Invalid payment token",
        payment: { priceUsd, payTo, networks, tokens, description, capabilityId },
      });
      return;
    }

    // Payment accepted — track and proceed
    if (onPayment) onPayment(token, req);

    // Wrap res.end to capture success/latency
    const origEnd = res.end.bind(res);
    res.end = function (...args: any[]) {
      const record: UsageRecord = {
        capabilityId,
        timestamp: Date.now(),
        latencyMs: Date.now() - start,
        success: res.statusCode < 400,
        payer: token.payer,
        amountUsd: priceUsd,
      };
      usageLog.push(record);
      return origEnd(...args);
    };

    next();
  };
}

/**
 * Default payment validation function - accepts any non-empty token.
 * 
 * In production environments, this should be replaced with proper on-chain
 * verification to validate payment proofs and transaction signatures.
 * 
 * @param token - Payment token to validate
 * @returns true if token appears valid, false otherwise
 * @internal
 */
function defaultValidate(token: PaymentToken): boolean {
  // In production, verify on-chain. For now accept any non-empty token.
  return Boolean(token.token && token.token.length > 0);
}

/**
 * Retrieves usage records for analytics and monitoring.
 * 
 * Returns an in-memory log of all requests processed by the x402 middleware,
 * including timing, success rates, and revenue data. This is useful for
 * capability providers to monitor their API usage and performance.
 * 
 * @param capabilityId - Optional capability ID to filter records. If not provided,
 *                       returns all usage records across all capabilities
 * @returns Array of usage records containing request metadata and performance metrics
 * 
 * @example
 * ```ts
 * // Get all usage records
 * const allRecords = getUsageLog();
 * 
 * // Get records for a specific capability
 * const codeReviewRecords = getUsageLog("code-review-v1");
 * 
 * console.log(`Total calls: ${codeReviewRecords.length}`);
 * console.log(`Revenue: $${codeReviewRecords.reduce((sum, r) => sum + r.amountUsd, 0)}`);
 * ```
 */
export function getUsageLog(capabilityId?: string): UsageRecord[] {
  if (!capabilityId) return usageLog;
  return usageLog.filter((r) => r.capabilityId === capabilityId);
}
