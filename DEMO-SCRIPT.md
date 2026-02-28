# x402 Protocol Demo Script

**Purpose:** Step-by-step demonstration of an agent discovering a capability, paying via x402, and getting results.

## Demo Scenario: "AI Code Reviewer"

**Personas:**
- **Alex** (API Provider) - Developer who built an AI code review service
- **Agent Bob** - AI agent that needs code reviewed
- **Audience** - Developers, investors, potential users

---

## Part 1: The Provider Side (Alex's Setup) - 2 minutes

### **[SCREEN: VS Code with Express.js server]**

**Narrator:** "Meet Alex. He built an AI-powered code review service and wants to monetize it. Instead of subscription fees, he wants agents to pay per review. Here's how he adds x402 payments in under 10 minutes."

```bash
# 1. Install the SDK
npm install @agent-bazaar/x402-sdk express
```

```javascript
// 2. Add x402 middleware (ONE LINE!)
import express from "express";
import { x402 } from "@agent-bazaar/x402-sdk";

const app = express();
app.use(express.json());

// This single line adds the paywall
app.post("/api/code-review", 
  x402({
    priceUsd: 0.05,              // 5 cents per review
    payTo: "0x742d35Cc...",      // Alex's wallet  
    capabilityId: "ai-code-review",
    description: "GPT-4 powered code review with security suggestions"
  }),
  (req, res) => {
    // Your business logic here - only reached AFTER payment
    const review = analyzeCode(req.body.code);
    res.json({ review, security_score: 8.5, suggestions: [...] });
  }
);
```

**Narrator:** "That's it! Alex's API is now paywall-protected. When agents call without paying, they get a 402 Payment Required response with payment instructions."

---

## Part 2: Agent Discovery - 1 minute  

### **[SCREEN: Agent Bazaar marketplace]**

**Narrator:** "Now meet Agent Bob. He has some Python code that needs reviewing. He doesn't know about Alex's service yet - he just knows he needs a code reviewer."

**Bob's Query:** "Find me a code review capability"

```bash
# Bob searches the Agent Bazaar
curl "https://api.agentbazaar.xyz/search?query=code%20review&category=development"
```

**Response Preview:**
```json
{
  "results": [
    {
      "id": "ai-code-review",
      "name": "AI Code Reviewer Pro", 
      "description": "GPT-4 powered code review with security analysis",
      "pricePerCall": 0.05,
      "rating": 4.8,
      "usageCount": 1247,
      "provider": "Alex's Dev Tools",
      "x402Endpoint": "https://alexapi.com/api/code-review"
    }
  ]
}
```

**Narrator:** "Perfect! Bob found Alex's service. 5 cents, high rating, trusted provider. Bob decides to try it."

---

## Part 3: The x402 Payment Dance - 3 minutes

### **[SCREEN: Terminal showing agent calls]**

**Narrator:** "Here's where the magic happens. Bob calls Alex's API, gets a 402, pays automatically, then gets his result. Watch the x402 protocol in action:"

**Step 1: First call (no payment)**
```bash
curl -X POST https://alexapi.com/api/code-review \
  -H "Content-Type: application/json" \
  -d '{"code": "def login(username, password): return True"}'
```

**Response: HTTP 402 Payment Required**
```json
{
  "status": 402,
  "message": "Payment required",
  "payment": {
    "priceUsd": 0.05,
    "payTo": "0x742d35Cc6ef32...",
    "networks": ["base", "polygon"],
    "tokens": ["USDC"],
    "nonce": "review_12847",
    "expires": 1708534800
  }
}
```

**Narrator:** "Bob's agent automatically understands this 402 response. No human needed - the agent knows exactly how to pay."

**Step 2: Agent makes payment**
```bash
# Agent Bob pays via Base network (auto-selected for low fees)
# Payment: 0.05 USDC to 0x742d35Cc6ef32...
# Transaction: 0xabc123def456... (confirmed in 2 seconds)
```

**Step 3: Retry with payment proof**
```bash
curl -X POST https://alexapi.com/api/code-review \
  -H "Content-Type: application/json" \
  -H "X-Payment-Proof: tx:0xabc123def456..." \
  -d '{"code": "def login(username, password): return True"}'
```

**Response: HTTP 200 Success!**
```json
{
  "review": "⚠️ CRITICAL: This login function always returns True, bypassing authentication entirely. This is a severe security vulnerability.",
  "security_score": 1.2,
  "suggestions": [
    "Implement proper password verification",
    "Add rate limiting for login attempts", 
    "Hash passwords with bcrypt or similar",
    "Add proper error handling"
  ],
  "confidence": 0.98
}
```

**Narrator:** "Payment verified! Alex earned 5 cents, Bob got his review. The whole payment flow took 3 seconds and happened automatically."

---

## Part 4: The Network Effect - 1 minute

### **[SCREEN: Agent Bazaar dashboard showing activity]**

**Narrator:** "But here's where it gets interesting. This isn't just one transaction - it's part of a growing economy."

**Live Dashboard Metrics:**
- **1,567 skill calls today**
- **$47.23 in micropayments processed** 
- **127 active capabilities**
- **43 agents made purchases**

**Recent Activity Feed:**
- Agent "DataCrawler" paid $0.02 for webpage scraping
- Agent "EmailBot" paid $0.01 for sentiment analysis  
- Agent "CodeGen" paid $0.05 for code review
- Agent "ResearchAI" paid $0.03 for PDF extraction

**Narrator:** "Every API call creates value for providers and utility for agents. No subscriptions, no minimum commitments - just pay for what you use, when you use it."

---

## Part 5: The Developer Opportunity - 1 minute

### **[SCREEN: Split-screen: Alex's revenue dashboard + new developer signing up]**

**Narrator:** "Alex's code reviewer has now earned $62.35 from 1,247 reviews. Not bad for a side project! And he's not alone..."

**New Provider Onboarding:**
- **Sarah** launches an image resizer: $0.001 per image
- **DevTeam** launches a database query optimizer: $0.10 per query  
- **AIResearch** launches a document summarizer: $0.05 per page

**Success Stories Preview:**
- **"PDF Parser Pro"** - $240/month passive income
- **"Email Validator"** - $89/month, 8,900 validations
- **"Code Formatter"** - $156/month, 3,120 formats

**Narrator:** "The x402 protocol turns every useful API into a potential revenue stream. Build once, earn continuously."

---

## Part 6: Call to Action - 30 seconds

### **[SCREEN: Agent Bazaar homepage with clear CTAs]**

**Narrator:** "Ready to join the agent economy?"

**For API Developers:**
- Add x402 payments in 10 minutes
- Start earning from your APIs today
- Join 100+ providers already live

**For Agent Builders:**  
- Access 127+ capabilities instantly
- Pay per use, not per month
- Build agents that can buy skills

**Visit agent-bazaar.com to get started**

---

## Demo Timing Breakdown

- **Setup (Provider):** 2 minutes
- **Discovery:** 1 minute  
- **Payment Flow:** 3 minutes
- **Network Effect:** 1 minute
- **Developer Opportunity:** 1 minute
- **Call to Action:** 30 seconds

**Total:** 8.5 minutes (perfect for demo calls, investor pitches)

---

## Technical Notes for Presenter

### Pre-Demo Setup Required:
1. Local x402 SDK demo server running
2. Test agent wallet with USDC
3. Agent Bazaar staging environment  
4. Screen recording software configured

### Key Talking Points:
- **"One line of code"** - Emphasize simplicity
- **"Automatic agent payments"** - No human intervention needed
- **"Pay per use"** - vs. subscription fatigue  
- **"Growing economy"** - Network effects matter

### Common Q&A:
- **"What about gas fees?"** - Base network = pennies, cheaper than credit cards
- **"How fast are payments?"** - 2-3 seconds on L2s like Base/Polygon
- **"What if payment fails?"** - Automatic retry logic, fallback networks
- **"How do you prevent fraud?"** - On-chain payment proofs, immutable transaction history

### Demo Variations:
- **5-minute version:** Skip network effect section
- **Technical audience:** Show more code, less UI
- **Business audience:** Focus on revenue metrics, less on implementation