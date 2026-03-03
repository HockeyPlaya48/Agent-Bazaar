import { X402Client } from '../client';
import { AgentConfig, Capability } from '../types';

/**
 * Create an AutoGen function from an Agent Bazaar skill
 */
export function createAutoGenTool(config: AgentConfig, capability: Capability) {
  const client = new X402Client(config);

  return {
    name: capability.slug,
    description: capability.description,
    
    // AutoGen callable function
    callable: async (args: Record<string, any>) => {
      try {
        const result = await client.call(capability.slug, args);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error || 'Tool execution failed',
            capability: capability.name
          };
        }

        return {
          success: true,
          data: result.data,
          metadata: result.metadata
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          capability: capability.name
        };
      }
    },

    // AutoGen function metadata
    function_map: {
      [capability.slug]: async (args: any) => {
        const client = new X402Client(config);
        const result = await client.call(capability.slug, args);
        return result.success ? result.data : { error: result.error };
      }
    }
  };
}

/**
 * Create AutoGen agent with Bazaar skills
 */
export async function createAutoGenAgent(
  config: AgentConfig,
  agentConfig: {
    name: string;
    systemMessage: string;
    skills?: string[];
  }
) {
  const client = new X402Client(config);
  
  let capabilities: Capability[] = [];
  if (agentConfig.skills && agentConfig.skills.length > 0) {
    const allCapabilities = await client.discover();
    capabilities = allCapabilities.filter(cap => 
      agentConfig.skills!.includes(cap.slug)
    );
  }

  const functionMap: Record<string, Function> = {};
  
  capabilities.forEach(capability => {
    functionMap[capability.slug] = async (args: any) => {
      const result = await client.call(capability.slug, args);
      return result.success ? result.data : { error: result.error };
    };
  });

  return {
    name: agentConfig.name,
    system_message: agentConfig.systemMessage,
    function_map: functionMap,
    capabilities: capabilities.map(cap => ({
      name: cap.slug,
      description: cap.description,
      parameters: cap.inputs || {}
    }))
  };
}