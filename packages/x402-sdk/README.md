# @agent-bazaar/x402-sdk

Payment protocol SDK for Agent Bazaar. Enables any API to accept micropayments via the x402 protocol.

## For API Providers (< 10 min setup)

```ts
import express from "express";
import { x402 } from "@agent-bazaar/x402-sdk";

const app = express();
app.use(express.json());

// Gate your endpoint behind a paywall
app.post(
  "/api/code-review",
  x402({
    priceUsd: 0.05,
    payTo: "0xYourAddress",
    capabilityId: "code-review",
    description: "GPT-4 powered code review",
  }),
  (req, res) => {
    // Your logic here — only reached after valid payment
    res.json({ review: "Looks good!" });
  }
);
```

When an agent calls without paying, they get:
```json
{ "status": 402, "payment": { "priceUsd": 0.05, "payTo": "0x...", "networks": ["base"], "tokens": ["USDC"] } }
```

## For Agents (Client SDK)

```ts
import { X402Client } from "@agent-bazaar/x402-sdk";

const client = new X402Client({
  registryUrl: "https://api.agentbazaar.xyz",
  paymentToken: "your-signed-payment-proof",
});

// Discover capabilities
const caps = await client.discover({ category: "code-generation" });

// Make a paid call
const result = await client.call(caps[0].id, { code: "function foo() {}" });
```

## Registry Functions

```ts
import { registerCapability, searchCapabilities } from "@agent-bazaar/x402-sdk";

// Register your capability
await registerCapability({
  name: "My Code Reviewer",
  slug: "my-code-reviewer",
  type: "api",
  category: "code-generation",
  pricePerCall: 0.05,
  x402Endpoint: "https://myapi.com/review",
  // ...
});

// Search
const results = await searchCapabilities("code review");
```

## License

MIT
