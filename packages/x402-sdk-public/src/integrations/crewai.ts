import { X402Client } from '../client';
import { AgentConfig, Capability } from '../types';

/**
 * Create a CrewAI tool from an Agent Bazaar skill
 */
export function createCrewAITool(config: AgentConfig, capability: Capability) {
  const client = new X402Client(config);

  // CrewAI Tool interface
  return {
    name: capability.slug,
    description: capability.description,
    
    func: async (input: any) => {
      try {
        const payload = typeof input === 'object' ? input : { input };
        const result = await client.call(capability.slug, payload);
        
        if (!result.success) {
          throw new Error(result.error || 'Tool execution failed');
        }

        return result.data;
      } catch (error) {
        throw new Error(`${capability.name} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    // CrewAI specific metadata
    args_schema: capability.inputs || undefined,
    return_direct: false,
    verbose: true
  };
}

/**
 * Create a CrewAI skill decorator
 */
export function bazaarSkill(slug: string, config: AgentConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const client = new X402Client(config);
    
    descriptor.value = async function (...args: any[]) {
      const payload = args.length === 1 ? args[0] : { args };
      const result = await client.call(slug, payload);
      
      if (!result.success) {
        throw new Error(result.error || 'Bazaar skill execution failed');
      }
      
      return result.data;
    };
    
    return descriptor;
  };
}