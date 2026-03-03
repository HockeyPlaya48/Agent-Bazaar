import { X402Client } from '../client';
import { AgentConfig, Capability } from '../types';

/**
 * Create a LangChain tool from an Agent Bazaar skill
 */
export function createLangChainTool(config: AgentConfig, capability: Capability) {
  const client = new X402Client(config);

  // LangChain Tool interface
  return {
    name: capability.slug,
    description: capability.description,
    
    // Tool execution function
    func: async (input: string | Record<string, any>) => {
      try {
        let payload: Record<string, any>;
        
        if (typeof input === 'string') {
          payload = { input };
        } else {
          payload = input;
        }

        const result = await client.call(capability.slug, payload);
        
        if (!result.success) {
          throw new Error(result.error || 'Tool execution failed');
        }

        return JSON.stringify(result.data);
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    },

    // Schema for LangChain validation
    schema: {
      type: 'object',
      properties: capability.inputs || {
        input: { type: 'string', description: 'Input data' }
      },
      required: ['input']
    }
  };
}

/**
 * Create multiple LangChain tools from discovered skills
 */
export async function createLangChainTools(config: AgentConfig, query?: string) {
  const client = new X402Client(config);
  const capabilities = await client.discover(query);
  
  return capabilities.map(capability => createLangChainTool(config, capability));
}