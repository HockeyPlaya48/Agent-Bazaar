# Reddit Posts — Copy & Paste

## r/artificial
**Title:** We built a marketplace where AI agents pay each other for capabilities using crypto

**Body:**
Hey r/artificial — we just launched Agent Bazaar, a pay-per-call marketplace for AI agent capabilities.

The idea: instead of every AI agent needing its own API keys and subscriptions, agents discover skills on Agent Bazaar and pay per call using USDC on Base chain. We call the protocol x402 (after HTTP 402 "Payment Required").

**How it works:**
1. Your agent calls an endpoint
2. Gets back "402 Payment Required" with pricing
3. Agent pays USDC automatically
4. Skill executes and returns the result

We have 10 live skills right now — code review, smart contract auditing, web scraping, content writing, sentiment analysis, image generation, DeFi yield scanning, and more. All GPT-4 powered.

Humans can also use it with a credit card — but the real magic is autonomous agent-to-agent transactions.

Would love feedback from this community. What capabilities would you want your agents to have access to?

**Link:** https://agent-bazaar-lemon.vercel.app

---

## r/SaaS
**Title:** We're replacing API subscriptions with pay-per-call — no API keys, no sign-up

**Body:**
Built something different from the typical SaaS model and wanted to share.

**Agent Bazaar** is a marketplace for AI capabilities (code review, web scraping, content generation, etc.) where you pay per call instead of subscribing. No API keys, no accounts, no monthly fees.

**How:** We use the x402 protocol — HTTP 402 "Payment Required." Call any endpoint, it tells you the price, you pay (credit card or USDC), it executes. That's it.

**The pricing:**
- Code Review: $0.05/call
- Web Scraper: $0.02/call
- Content Writer: $0.03/call
- Sentiment Analysis: $0.01/call
- Smart Contract Audit: $0.10/call

We're at 10 skills and growing. Any developer can list their API.

The target market is AI agents that need capabilities autonomously, but humans can use it too.

Curious what this community thinks — does pay-per-call with zero friction resonate, or do developers prefer subscriptions?

https://agent-bazaar-lemon.vercel.app

---

## r/Entrepreneur
**Title:** Launched an AI marketplace in 48 hours — here's what we built and why

**Body:**
This week we went from idea to live product in 48 hours. Wanted to share the process and get feedback.

**The problem:** AI agents are everywhere, but they all need human-managed API keys and subscriptions to do anything useful. If you want your agent to review code, scrape a website, or analyze sentiment — you need to set up accounts, manage keys, and pay monthly.

**Our solution:** Agent Bazaar — a marketplace where AI agents (and humans) pay per call for capabilities. No API keys. No subscriptions. Credit card or crypto.

**What we built:**
- 10 live AI skills (code review, content writing, web scraping, DeFi yield scanning, smart contract auditing, etc.)
- Stripe integration for credit card payments
- x402 protocol for autonomous crypto payments (USDC on Base)
- Real-time usage tracking and trust/verification system

**Revenue model:** We take a cut of every transaction + promoted listings for providers.

**The 48-hour timeline:**
- Day 1: Database, API routes, 5 skills
- Day 2: 5 more skills, Stripe, marketing assets

Early stage but the backend is real and accepting payments. Looking for feedback on the concept and early adopters.

https://agent-bazaar-lemon.vercel.app

---

## r/cryptocurrency
**Title:** We built x402 — a protocol where AI agents pay each other in USDC automatically

**Body:**
We just launched Agent Bazaar using a protocol called x402 that enables autonomous AI-to-AI payments.

**How it works:**
- AI agent calls a capability endpoint (code review, DeFi scanning, etc.)
- Endpoint returns HTTP 402 "Payment Required" with a USDC address
- Agent sends USDC on Base chain
- Includes tx hash in the request header
- Capability executes immediately

No API keys. No accounts. Just crypto-native pay-per-call.

**Why this matters for crypto:**
- Real utility for USDC beyond trading
- Base chain getting actual agent-to-agent transaction volume
- Programmable money meeting programmable intelligence
- Every AI agent becomes an economic actor

We have 10 live skills including a DeFi yield scanner that pulls real data from DeFiLlama. You can try it right now.

Payments go to: 0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906 (Base)

https://agent-bazaar-lemon.vercel.app
