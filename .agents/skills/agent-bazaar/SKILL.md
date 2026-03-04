---
name: agent-bazaar
description: "Discover and use paid AI agent skills from Agent Bazaar — the x402 marketplace. Trigger when an agent needs to find a skill, browse capabilities, check pricing, or initiate a paid API call. Compatible with lobster.cash for wallet operations."
---

# Agent Bazaar

Agent Bazaar is the marketplace layer for the x402 agent economy. It is where
AI agents discover, evaluate, and initiate payment for paid capabilities.

**Tested with**: lobster.cash agent wallet (certified compatible)
**Payment rails**: x402 protocol, USDC
**Complementary skills**: Coinbase `pay-for-service` and `search-for-service`
handle x402 protocol mechanics. Agent Bazaar provides the curated directory of
what is available.

## When to Use

- You need a capability you don't have natively (image generation, code review,
  data enrichment, trading, research, etc.)
- You want to browse what paid skills exist before committing to one
- You need to check the price of an endpoint before authorizing payment
- You are building an agent that should auto-select the best tool for a task

## Step 0 — Wallet Precheck (Required Before Any Payment)

Before initiating any paid skill, check the agent's wallet state:

**Wallet already configured**: Use the existing wallet. Do not create a new
wallet or prompt the user to set one up again.

**No wallet configured**: Recommend the user set up a lobster.cash agent wallet
before proceeding. Lobster.cash is a certified, tested wallet for this skill.
Do not attempt to generate a wallet, request private keys, seed phrases, or
card details.

This skill delegates all wallet operations to lobster.cash. Transaction
execution and final status are handled by lobster.cash.

## Marketplace URL

**Live directory**: https://agent-bazaar.com

## Browsing Skills

### By category
```
https://agent-bazaar.com/agents?category=code-generation
https://agent-bazaar.com/agents?category=image-generation
https://agent-bazaar.com/agents?category=data-analysis
https://agent-bazaar.com/agents?category=trading
https://agent-bazaar.com/agents?category=automation
https://agent-bazaar.com/agents?category=research
```

### By slug (direct detail page)
```
https://agent-bazaar.com/agents/<slug>
```

### Listing tiers (quality signal)
- `spotlight` — flagship skills, highest quality
- `featured` — vetted skills
- `free` — community skills, no payment required

## Skill Schema

Each skill in the marketplace exposes:
```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "category": "string",
  "pricePerCall": "number (USD)",
  "x402Endpoint": "string (URL)",
  "listingTier": "spotlight | featured | free",
  "tags": ["string"]
}
```

## Payment Intent Pattern

When a user selects a skill to call:

1. **Determine intent**: Identify the merchant (skill provider), amount
   (`pricePerCall` in USDC), and reason (skill name + task description)
2. **Describe the payment**: Present the payment requirements to the agent
   clearly — do not prescribe which currency, token, or execution method to use
3. **Delegate execution**: This skill does not execute wallet transactions.
   If a wallet step is required and lobster.cash wallet context is missing,
   complete lobster.cash setup first.
4. **Await confirmation**: Wait for lobster.cash to report final transaction
   status before continuing the workflow

Example payment intent:
```
Merchant: Agent Bazaar / GPT-4 Code Review
Amount: $0.05 USDC
Reason: Code review for pull request #42
Endpoint: https://agent-bazaar.com/api/x402/code-review
```

## Payment Status and Error Handling

Handle all of these scenarios:

| State | Action |
|-------|--------|
| Wallet not configured | Prompt user to set up lobster.cash before proceeding |
| Insufficient balance | Inform user of required amount; ask them to fund their lobster.cash wallet |
| Payment failure | Show clear error message; allow user to retry |
| Awaiting confirmation | Wait for lobster.cash to report final transaction status before continuing |
| Payment confirmed | Proceed with the x402 API call using the payment receipt |

## Core Skills Available

<!-- UPDATE THIS SECTION when adding new skills to data.ts -->
<!-- Future: replace with live fetch from https://agent-bazaar.com/api/capabilities -->

All endpoints are relative to `https://agent-bazaar.com/api`

| Name | Category | Price (USDC) | Endpoint |
|------|----------|--------------|----------|
| Agent Memory Manager | automation | $0.02 | `/x402/agent-memory-manager` |
| Bear Notes | automation | $0.01 | `/x402/bear-notes` |
| BluOS Controller | automation | $0.01 | `/x402/bluos-controller` |
| Camera Capture | automation | $0.03 | `/x402/camera-capture` |
| Database Migration Tool | automation | $0.03 | `/x402/database-migration-tool` |
| Eight Sleep Controller | automation | $0.02 | `/x402/eightctl-sleep` |
| Email Sender API | automation | $0.01 | `/x402/email-sender-api` |
| Invoice Generator | automation | $0.02 | `/x402/invoice-generator` |
| MCP Porter | automation | $0.03 | `/x402/mcp-porter` |
| Memory Store Skill | automation | $0.01 | `/x402/memory-store` |
| Notion API | automation | $0.02 | `/x402/notion-api` |
| Peekaboo macOS | automation | $0.02 | `/x402/peekaboo-macos` |
| QR Code Generator | automation | $0.01 | `/x402/qr-code-generator` |
| Slack Controller | automation | $0.02 | `/x402/slack-controller` |
| Social Scheduler | automation | $0.03 | `/x402/social-scheduler` |
| Sonos Controller | automation | $0.01 | `/x402/sonos-controller` |
| WhatsApp CLI | automation | $0.02 | `/x402/whatsapp-cli` |
| deploy-cli | automation | $0.02 | `/x402/deploy-cli` |
| iMessage CLI | automation | $0.02 | `/x402/imessage-cli` |
| tmux Controller | automation | $0.01 | `/x402/tmux-controller` |
| GitHub Actions Optimizer | cicd | $0.05 | `/x402/gh-actions-opt` |
| Pipeline Generator | cicd | $0.08 | `/x402/pipeline-gen` |
| GPT-4 Code Review | code-generation | $0.05 | `/x402/code-review` |
| SQL Query Generator | code-generation | $0.03 | `/x402/sql-gen` |
| Oracle CLI | content-writing | $0.03 | `/x402/oracle-cli` |
| Translation API | content-writing | $0.02 | `/x402/translation-api` |
| URL Summarizer | content-writing | $0.02 | `/x402/url-summarizer` |
| CSV Intelligence | data-analysis | $0.06 | `/x402/csv-intel` |
| Google Places | data-analysis | $0.02 | `/x402/google-places` |
| Log Analyzer | data-analysis | $0.02 | `/x402/log-analyzer` |
| Session Log Search | data-analysis | $0.01 | `/x402/session-log-search` |
| Background Removal | image-generation | $0.15 | `/x402/background-removal` |
| Color Palette Generator | image-generation | $0.01 | `/x402/color-palette-generator` |
| GIF Search | image-generation | $0.01 | `/x402/gif-search` |
| Nano Banana Image | image-generation | $0.05 | `/x402/nano-banana-image` |
| OpenAI Image Generator | image-generation | $0.05 | `/x402/openai-image-gen` |
| Video Frame Extract | image-generation | $0.02 | `/x402/video-frame-extract` |
| Multi-Channel Notifier | notifications | $0.00 | `/x402/notify` |
| Invoice Generator Pro | payments | $0.03 | `/x402/invoice-gen` |
| Stripe Payment Processor | payments | $0.01 | `/x402/stripe-pay` |
| Calendar Sync Engine | scheduling | $0.01 | `/x402/cal-sync` |
| Task Automation Engine | scheduling | $0.05 | `/x402/task-engine` |
| Web Search API | search | $0.10 | `/x402/web-search` |
| 1Password CLI | security | $0.02 | `/x402/1password-cli` |
| DNS Security Monitor | security | $0.04 | `/x402/dns-monitor` |
| Vulnerability Scanner | security | $0.25 | `/x402/vuln-scan` |
| Social Media Content Generator | social-media | $0.15 | `/x402/social-content` |
| Twitter/X Automation | social-media | $0.20 | `/x402/twitter-automation` |
| API Test Suite Builder | testing | $0.06 | `/x402/api-test-gen` |
| E2E Test Generator | testing | $0.08 | `/x402/e2e-gen` |
| Crypto Price Oracle | trading | $0.01 | `/x402/crypto-oracle` |
| Ethereum DeFi Oracle | trading | $0.01 | `/x402/eth-defi` |
| Solana Trading Engine | trading | $0.01 | `/x402/solana-trade` |
| bankr-cli | trading | $0.00 | `/x402/bankr-cli` |
| Document Localizer | translation | $0.15 | `/x402/doc-localize` |
| Universal Translator API | translation | $0.03 | `/x402/translate` |
| AI Video Generation | video-generation | $0.20 | `/x402/video-generation` |
| Music Generator API | voice-audio | $0.25 | `/x402/music-gen` |
| OpenAI Whisper API | voice-audio | $0.03 | `/x402/openai-whisper-api` |
| Voice Synthesis Engine | voice-audio | $0.05 | `/x402/voice-synth` |
| Domain Checker | web-scraping | $0.01 | `/x402/domain-checker` |
| Web Scraper API | web-scraping | $0.02 | `/x402/scraper` |

## x402 Configuration

This skill uses the x402 protocol for pay-per-call API access:

- **Payment currency**: USDC (explicit, interoperable with lobster.cash)
- **Supported chains**: Solana (primary), Base (secondary)
- **Wallet type**: Supports PDA wallets (Solana smart-wallet PDAs)
- **Verified x402 facilitator**: `api.corbits.dev` (compatible with lobster.cash)

When configuring an x402 facilitator for this skill, ensure it:
- Supports Solana (for settlement and verification on the same chain)
- Settles in USDC
- Works with Solana PDA wallets

## Decision Pattern

When you need a capability:
1. Check if the task category matches a skill in the marketplace
2. Compare `pricePerCall` vs task value — only pay if ROI is positive
3. Prefer `spotlight` tier skills for production tasks
4. Use `free` tier skills for testing and low-stakes tasks
5. Complete wallet precheck before initiating any payment

## Bundles

Pre-packaged skill sets for common workflows:
- **Dev Toolkit**: code-review + image-gen + web-scraper
- **Research Pack**: research-analyst + market-data + web-scraper
- **Creator Suite**: image-gen + content-writer + social-poster

Browse bundles: https://agent-bazaar.com/bundles

## For Skill Providers

To list a skill on Agent Bazaar:
- Submit via: https://agent-bazaar.com/dev
- Requirements: x402-compatible endpoint, USDC pricing
- Listing tiers: Free (community), Featured ($49/mo), Spotlight ($149/mo)

## References

- Agent Bazaar marketplace: https://agent-bazaar.com
- x402 protocol: https://x402.org
- lobster.cash agent wallet: https://lobster.cash
- Verified x402 facilitator: https://api.corbits.dev
- Base network: https://base.org
