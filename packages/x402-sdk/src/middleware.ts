import type { X402MiddlewareConfig, PaymentToken, PaymentInfo, UsageRecord } from "./types";

// In-memory usage log (provider-side)
const usageLog: UsageRecord[] = [];

/**
 * Express/Connect-style middleware that gates an endpoint behind x402 payment.
 *
 * Usage:
 * ```ts
 * import express from "express";
 * import { x402 } from "@agent-bazaar/x402-sdk";
 *
 * const app = express();
 * app.post("/api/code-review", x402({ priceUsd: 0.05, payTo: "0x..." }), handler);
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

function defaultValidate(token: PaymentToken): boolean {
  // In production, verify on-chain. For now accept any non-empty token.
  return Boolean(token.token && token.token.length > 0);
}

/** Get usage records for a capability (provider-side) */
export function getUsageLog(capabilityId?: string): UsageRecord[] {
  if (!capabilityId) return usageLog;
  return usageLog.filter((r) => r.capabilityId === capabilityId);
}
