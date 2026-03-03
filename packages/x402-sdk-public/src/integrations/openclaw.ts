import { X402Client } from '../client';
import { AgentConfig, Capability } from '../types';

/**
 * Create an OpenClaw skill from an Agent Bazaar capability
 */
export function createOpenClawSkill(config: AgentConfig, capability: Capability) {
  const client = new X402Client(config);

  return {
    name: capability.slug,
    description: capability.description,
    category: capability.category,
    
    // OpenClaw skill execution
    execute: async (params: Record<string, any>) => {
      try {
        const result = await client.call(capability.slug, params);
        
        if (!result.success) {
          throw new Error(result.error || 'Skill execution failed');
        }

        return {
          success: true,
          data: result.data,
          cost: result.metadata?.billedAmount || 0,
          latency: result.metadata?.latencyMs || 0
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          skill: capability.name
        };
      }
    },

    // SKILL.md content for OpenClaw
    skillMd: `# ${capability.name}

${capability.description}

## Usage

\`\`\`typescript
import { bazaar } from './bazaar-integration';

const result = await bazaar.${capability.slug}(${JSON.stringify(capability.inputs || { input: 'your_input' }, null, 2)});
console.log(result);
\`\`\`

## Cost

- **Price**: $${capability.pricePerCall}/call
- **Payment**: Automatic via x402
- **Demo mode**: Use "demo" token for testing

## Integration

This skill is powered by Agent Bazaar (${capability.x402Endpoint}).
`,

    // Cost and metadata
    pricing: {
      model: 'pay-per-call',
      cost: capability.pricePerCall,
      currency: 'USD'
    },
    
    metadata: {
      source: 'agent-bazaar',
      endpoint: capability.x402Endpoint,
      version: '1.0.0',
      category: capability.category,
      tags: capability.tags
    }
  };
}

/**
 * Generate TOOLS.md content for OpenClaw agents
 */
export async function generateToolsMd(config: AgentConfig, skills?: string[]): Promise<string> {
  const client = new X402Client(config);
  const allCapabilities = await client.discover();
  
  const relevantCapabilities = skills 
    ? allCapabilities.filter(cap => skills.includes(cap.slug))
    : allCapabilities.slice(0, 10); // Top 10 if no specific skills

  return `# TOOLS.md - Agent Bazaar Skills

## Available Skills

${relevantCapabilities.map(cap => `### ${cap.name}
- **Endpoint**: ${cap.x402Endpoint}
- **Cost**: $${cap.pricePerCall}/call
- **Category**: ${cap.category}
- **Description**: ${cap.description}

\`\`\`typescript
// Usage example
const result = await bazaar.${cap.slug}({
${Object.entries(cap.inputs || { input: 'string' }).map(([key, type]) => `  ${key}: ${JSON.stringify(type)}`).join(',\n')}
});
\`\`\`
`).join('\n')}

## Setup

1. Add your wallet to environment:
\`\`\`bash
export BAZAAR_WALLET_ADDRESS="0x..."
export BAZAAR_PRIVATE_KEY="0x..." # Optional for auto-pay
\`\`\`

2. Initialize the client:
\`\`\`typescript
import { createX402Client } from '@agentbazaar/x402-sdk';

const bazaar = createX402Client({
  walletAddress: process.env.BAZAAR_WALLET_ADDRESS!,
  privateKey: process.env.BAZAAR_PRIVATE_KEY,
  baseUrl: 'https://agent-bazaar.com'
});
\`\`\`

## Cost Tracking

Skills are pay-per-use. Track costs in your daily memory files:

\`\`\`markdown
## Skill Usage - 2024-03-03
- Web Search: 5 calls × $0.005 = $0.025
- Code Review: 2 calls × $0.05 = $0.10
- **Total**: $0.125
\`\`\`
`;
}