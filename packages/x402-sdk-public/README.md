# @agentbazaar/x402-sdk

> Open source SDK for x402 protocol - pay-per-use for APIs, CLI tools, and agent skills

The x402 SDK enables seamless integration with Agent Bazaar's marketplace of skills. Pay per use, no subscriptions, framework-agnostic.

## Quick Start

```bash
npm install @agentbazaar/x402-sdk
```

```typescript
import { createX402Client } from '@agentbazaar/x402-sdk';

const client = createX402Client({
  walletAddress: '0x...',
  privateKey: '0x...', // optional
  baseUrl: 'https://agent-bazaar.com' // optional
});

// Discover available skills
const skills = await client.discover('web scraping');

// Call a skill
const result = await client.call('web-scraper', {
  url: 'https://example.com',
  selector: 'h1'
});

console.log(result.data);
```

## Framework Integrations

### LangChain

```typescript
import { createLangChainTool } from '@agentbazaar/x402-sdk';

const webScrapeTool = createLangChainTool(config, capability);
// Use with LangChain agents
```

### CrewAI

```typescript
import { createCrewAITool } from '@agentbazaar/x402-sdk';

const tool = createCrewAITool(config, capability);
// Add to CrewAI agent tools
```

### AutoGen

```typescript
import { createAutoGenAgent } from '@agentbazaar/x402-sdk';

const agent = await createAutoGenAgent(config, {
  name: 'WebAgent',
  systemMessage: 'I help with web automation',
  skills: ['web-scraper', 'web-search']
});
```

### OpenClaw

```typescript
import { generateToolsMd } from '@agentbazaar/x402-sdk';

const toolsContent = await generateToolsMd(config, ['web-search', 'code-review']);
// Save to TOOLS.md in your OpenClaw workspace
```

## Core Features

### Discovery

```typescript
// Find all skills
const allSkills = await client.discover();

// Search specific skills
const webSkills = await client.discover('web scraping');

// Filter by category
const codeSkills = await client.discover('code');
```

### Skill Execution

```typescript
// Simple call with demo token
const result = await client.call('web-search', {
  query: 'AI agents',
  limit: 5
}, { paymentToken: 'demo' });

// Auto-payment (requires private key)
const result = await client.payAndCall('web-scraper', {
  url: 'https://example.com'
}, 0.02);
```

### Agent Building

```typescript
const agent = await client.build('Create a crypto monitoring agent that tracks prices and sends alerts');

console.log(agent.setup_instructions);
// Get complete OpenClaw agent configuration
```

### Payment Verification

```typescript
const verification = await client.verifyPayment(
  '0x...transaction_hash', 
  'web-scraper'
);

if (verification.verified) {
  console.log(`Payment of ${verification.amount} ${verification.token} confirmed`);
}
```

## Convenience Functions

```typescript
import { discoverSkills, payAndCall, verifyPayment } from '@agentbazaar/x402-sdk';

// One-off discovery
const skills = await discoverSkills(config, 'image generation');

// Quick pay and call
const result = await payAndCall(config, 'dalle-image', { prompt: 'sunset' }, 0.08);

// Verify payment
const verified = await verifyPayment(config, txHash, 'dalle-image');
```

## Configuration

### Environment Variables

```bash
# Required
export BAZAAR_WALLET_ADDRESS="0x..."

# Optional - enables auto-payment
export BAZAAR_PRIVATE_KEY="0x..."

# Optional - custom endpoint
export BAZAAR_BASE_URL="https://agent-bazaar.com"
```

### Programmatic Config

```typescript
const config = {
  walletAddress: process.env.BAZAAR_WALLET_ADDRESS!,
  privateKey: process.env.BAZAAR_PRIVATE_KEY,
  baseUrl: process.env.BAZAAR_BASE_URL || 'https://agent-bazaar.com'
};

const client = createX402Client(config);
```

## Error Handling

```typescript
try {
  const result = await client.call('web-scraper', { url: 'invalid-url' });
  
  if (!result.success) {
    console.error('Skill failed:', result.error);
    
    // Check if payment required
    if (result.error === 'Payment required') {
      console.log('Payment info:', result.data);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Available Skills

The SDK works with all Agent Bazaar skills:

- **Web Search** - Real-time search results ($0.005/call)
- **Web Scraper** - Extract data from any website ($0.02/call)
- **Code Review** - AI-powered security analysis ($0.05/call)
- **DALL-E Images** - Generate images from text ($0.08/call)
- **Blog Writer** - SEO-optimized content ($0.15/call)
- **Crypto Oracle** - Real-time crypto prices ($0.005/call)
- **Memory Store** - Vector-based agent memory ($0.01/call)
- **Email Composer** - Context-aware emails ($0.02/call)
- And 50+ more...

Browse all skills at [agent-bazaar.com](https://agent-bazaar.com)

## Demo Mode

Use `"demo"` as the payment token for testing:

```typescript
const result = await client.call('web-search', 
  { query: 'test' }, 
  { paymentToken: 'demo' }
);
```

## TypeScript

Fully typed with excellent IntelliSense support:

```typescript
import { Capability, X402Response, BuildAgentResponse } from '@agentbazaar/x402-sdk';

const result: X402Response<any> = await client.call('web-scraper', payload);
const capabilities: Capability[] = await client.discover();
```

## License

MIT - Use in any project, commercial or personal.

## Links

- [Agent Bazaar](https://agent-bazaar.com) - Browse skills
- [Documentation](https://agent-bazaar.com/docs) - Full API docs
- [GitHub](https://github.com/agent-bazaar/x402-sdk) - Source code
- [NPM](https://npmjs.com/@agentbazaar/x402-sdk) - Package

## Support

- Discord: [Agent Bazaar Community](https://discord.gg/agent-bazaar)
- Email: sdk@agent-bazaar.com
- Issues: [GitHub Issues](https://github.com/agent-bazaar/x402-sdk/issues)