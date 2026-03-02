# Agent Bazaar — CLAUDE.md

## What It Is
"Discover Agent Skills" — AppSumo-style deal marketplace for AI agent skills (APIs, CLI tools, agent skills). Pay-per-use via x402 protocol. Three listing tiers: Free, Featured ($49/mo ★), Spotlight ($149/mo ⚡ glowing border).

## Architecture
```
frontend/           Next.js 14 + Tailwind + TypeScript — all data is static
  src/app/          pages: / (home), /agents (browse), /agents/[slug], /bundles, /dev, /dashboard
  src/lib/data.ts   CAPABILITIES[] and BUNDLES[] — seed data lives here
  src/lib/api.ts    API helpers (currently static, no real backend)
  src/types/        Capability, Bundle interfaces
```

## Deployment
- **Live URL**: agent-bazaar-lemon.vercel.app
- **Deploy**: `npx vercel --prod` from `frontend/` directory — NEVER from repo root
- **Git**: `~/Desktop/agent-bazaar/` → GitHub

## Key Rules
- All data is static in `src/lib/data.ts` — no real API calls in production
- Adding a new skill: add to `CAPABILITIES[]` in `data.ts` with correct `listingTier`
- Adding a bundle: add to `BUNDLES[]` in `data.ts`, reference existing capability slugs
- Listing tiers: `"free"` | `"featured"` | `"spotlight"` — spotlight gets glow border + ⚡
- Sort order on browse page: spotlight → featured → free, then by `usageCount`

## Key Files
- `frontend/src/lib/data.ts` — all seed data (CAPABILITIES, BUNDLES, CATEGORIES)
- `frontend/src/lib/api.ts` — API types + legacy aliases
- `frontend/src/types/index.ts` — Capability, Bundle, Category interfaces
- `frontend/src/components/capability-card.tsx` — skill card component
- `frontend/src/app/page.tsx` — homepage with search + featured/all skills
- `frontend/src/app/agents/page.tsx` — browse with category filter + sort

## Common Pitfalls
- If Vercel builds from repo root (not `frontend/`), it will fail — always deploy with CLI from `frontend/`
- `CAPABILITIES` is the canonical export — `AGENTS` is just an alias for backwards compat
- Don't import from non-existent files — check `data.ts` and `api.ts` exports before adding imports
