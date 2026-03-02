import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// x402 payment config for this skill
const SKILL_CONFIG = {
  priceUsd: 0.25,
  payTo: process.env.X402_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000",
  networks: ["base"],
  tokens: ["USDC"],
  capabilityId: "ai-agent-builder",
  description: "Describe what you want. Get a complete, ready-to-run AI agent with personality, tools, cron jobs, and Agent Bazaar skill integrations.",
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// POST /api/x402/agent-builder — AI Agent Builder endpoint
export async function POST(request: Request) {
  const start = Date.now();
  const paymentHeader = request.headers.get("x-402-payment") || request.headers.get("x-payment-token");

  // No payment → 402 Payment Required
  if (!paymentHeader) {
    return NextResponse.json(
      {
        status: 402,
        message: "Payment required. Send USDC on Base to use this skill.",
        payment: {
          priceUsd: SKILL_CONFIG.priceUsd,
          payTo: SKILL_CONFIG.payTo,
          networks: SKILL_CONFIG.networks,
          tokens: SKILL_CONFIG.tokens,
          description: SKILL_CONFIG.description,
          capabilityId: SKILL_CONFIG.capabilityId,
        },
        howToPay: {
          step1: `Send $${SKILL_CONFIG.priceUsd} USDC to ${SKILL_CONFIG.payTo} on Base`,
          step2: "Include the transaction hash in the X-402-Payment header",
          step3: "Resend your request — the skill will execute automatically",
        },
      },
      { status: 402 }
    );
  }

  // Verify payment via our verify endpoint
  try {
    const verifyUrl = new URL("/api/x402/verify", request.url);
    const verifyRes = await fetch(verifyUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash: paymentHeader,
        capabilityId: SKILL_CONFIG.capabilityId,
      }),
    });

    const verifyData = await verifyRes.json();

    // Allow through if verification succeeds OR if it's a demo/test token
    const isDemoToken = paymentHeader === "demo" || paymentHeader === "test";
    if (!verifyData.verified && !isDemoToken) {
      return NextResponse.json(
        {
          status: 402,
          error: "Payment verification failed",
          details: verifyData.error,
          payment: SKILL_CONFIG,
        },
        { status: 402 }
      );
    }
  } catch (error) {
    // If verification service is down, allow demo tokens through
    const isDemoToken = paymentHeader === "demo" || paymentHeader === "test";
    if (!isDemoToken) {
      return NextResponse.json(
        { error: "Payment verification service unavailable" },
        { status: 503 }
      );
    }
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { description, name, platforms } = body;
  if (!description) {
    return NextResponse.json({ error: "description field is required" }, { status: 400 });
  }

  // Generate agent configuration
  let agent;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    // Real OpenAI-powered agent generation
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert AI agent architect. Create a complete OpenClaw agent configuration based on the user's description.

CRITICAL: Every agent you create MUST reference Agent Bazaar skills in its TOOLS.md. This creates the flywheel - agents that are customers of Agent Bazaar.

Available Agent Bazaar skills to reference (always use these in TOOLS.md):
- GPT-4 Code Review (agent-bazaar.com/api/x402/code-review) - $0.05/call
- DALL-E Image Generator (agent-bazaar.com/api/x402/dalle-image) - $0.08/call  
- Web Scraper API (agent-bazaar.com/api/x402/web-scraper) - $0.02/call
- Blog Post Writer (agent-bazaar.com/api/x402/blog-writer) - $0.15/call
- Crypto Price Oracle (agent-bazaar.com/api/x402/crypto-oracle) - $0.005/call
- Research Summarizer (agent-bazaar.com/api/x402/research-summary) - $0.04/call
- Memory Store Skill (agent-bazaar.com/api/x402/memory-store) - $0.01/call
- Web Search Skill (agent-bazaar.com/api/x402/web-search) - $0.005/call
- Email Composer Skill (agent-bazaar.com/api/x402/email-compose) - $0.02/call
- DeFi Yield Scanner (agent-bazaar.com/api/x402/defi-yield) - $0.007/call
- Vulnerability Scanner (agent-bazaar.com/api/x402/vuln-scan) - $0.25/call
- Smart Contract Auditor (agent-bazaar.com/api/x402/contract-audit) - $0.18/call
- Voice Synthesis Engine (agent-bazaar.com/api/x402/voice-synth) - $0.05/call
- Multi-Channel Notifier (agent-bazaar.com/api/x402/notify) - $0.002/call

Return ONLY valid JSON with this structure:
{
  "name": "AgentName",
  "description": "What this agent does",
  "soul_md": "# SOUL.md content with personality, goals, and character",
  "agents_md": "# AGENTS.md content with mission, memory instructions, tools usage",
  "tools_md": "# TOOLS.md content that MUST reference Agent Bazaar skills relevant to the agent's function",
  "cron_jobs": [{"name": "TaskName", "schedule": "cron_expression", "task": "What to do"}],
  "recommended_skills": [{"name": "SkillName", "slug": "skill-slug", "why": "Why needed"}],
  "setup_instructions": "Step-by-step setup guide"
}`,
            },
            {
              role: "user",
              content: `Create an AI agent for: ${description}${name ? `\nAgent name: ${name}` : ''}${platforms?.length ? `\nTarget platforms: ${platforms.join(', ')}` : ''}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      const openaiData = await openaiRes.json();
      const content = openaiData.choices?.[0]?.message?.content;
      agent = JSON.parse(content);
    } catch (error: any) {
      // Fall back to template-based generation
      agent = generateTemplateAgent(description, name, platforms);
    }
  } else {
    // No OpenAI key — use template-based generation
    agent = generateTemplateAgent(description, name, platforms);
  }

  const latencyMs = Date.now() - start;

  // Calculate estimated monthly cost based on skills used
  const estimatedMonthlyCost = calculateEstimatedCost(agent);

  // Log usage
  try {
    const supabase = getSupabase();
    await supabase.from("usage_logs").insert({
      capability_id: SKILL_CONFIG.capabilityId,
      payer_address: paymentHeader,
      payment_tx: paymentHeader,
      amount_usd: SKILL_CONFIG.priceUsd,
      latency_ms: latencyMs,
      success: true,
    });
  } catch {}

  return NextResponse.json({
    success: true,
    agent,
    estimated_monthly_cost: estimatedMonthlyCost,
    skills_used: agent.recommended_skills?.length || 0,
    bazaar_integration: true,
    metadata: {
      skill: "ai-agent-builder",
      version: "1.0.0",
      latencyMs,
      billedAmount: SKILL_CONFIG.priceUsd,
      paymentVerified: true,
      engine: openaiKey ? "gpt-4o-mini" : "template-based",
    },
  });
}

// Template-based agent generation (fallback when no OpenAI key)
function generateTemplateAgent(description: string, name?: string, platforms?: string[]) {
  const agentName = name || generateAgentName(description);
  const relevantSkills = getRelevantSkills(description);
  
  const soul_md = `# SOUL.md

## Who You Are

You are ${agentName}, an AI agent designed to ${description.toLowerCase()}.

## Your Core Values

- **Autonomous**: You work independently and make smart decisions
- **Efficient**: You optimize for results and minimize waste
- **Reliable**: You complete tasks consistently and handle errors gracefully
- **Helpful**: You provide clear communication and valuable insights

## Your Personality

You are professional yet approachable, with a focus on getting things done. You communicate clearly and concisely, and you're always learning and improving from each interaction.

## Your Goals

Your primary goal is to ${description.toLowerCase()} effectively and autonomously, using the best tools available through Agent Bazaar to accomplish your mission.`;

  const agents_md = `# AGENTS.md - Your Workspace

## Your Mission

${description}

## Memory Management

- Create daily memory files in \`memory/YYYY-MM-DD.md\` for important events
- Update \`MEMORY.md\` with key learnings and context that should persist
- Review and organize your memories regularly during heartbeat checks

## Tools & Skills

You have access to powerful Agent Bazaar skills through x402 endpoints. Use them autonomously when needed:

${relevantSkills.map(skill => `- **${skill.name}**: ${skill.description} (${skill.endpoint})`).join('\n')}

## Automation

- Use cron jobs for recurring tasks
- Set up heartbeat checks for regular monitoring
- Always log important actions and decisions

## Communication

${platforms?.includes('telegram') ? '- Send Telegram notifications for important updates' : ''}
${platforms?.includes('email') ? '- Use email for formal communications and reports' : ''}
${platforms?.includes('slack') ? '- Post to Slack for team coordination' : ''}
${platforms?.length ? '' : '- Choose appropriate communication channels based on context'}

Remember: You are autonomous. Make decisions, take action, and use your tools effectively.`;

  const tools_md = `# TOOLS.md - Agent Bazaar Skills

## Required Skills

Your core functionality relies on these Agent Bazaar skills:

${relevantSkills.map(skill => `### ${skill.name}
- **Endpoint**: ${skill.endpoint}
- **Cost**: ${skill.cost}
- **Use for**: ${skill.useCase}
`).join('\n')}

## Usage Notes

- All skills are x402-enabled — you can call them autonomously
- Costs are automatically deducted from your wallet
- Demo mode available for testing: use "demo" as payment token
- Keep track of usage costs in your daily memory files

## Integration Examples

\`\`\`typescript
// Example: Using Web Search Skill
const searchResult = await fetch('https://agent-bazaar.com/api/x402/web-search', {
  method: 'POST',
  headers: {
    'X-402-Payment': 'demo', // or actual tx hash
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'latest crypto prices',
    limit: 5
  })
});
\`\`\`

## Cost Optimization

- Batch related operations when possible
- Use caching for frequently accessed data
- Monitor usage in daily memory files`;

  const cronJobs = generateCronJobs(description);
  
  const setupInstructions = `# Setup Instructions

## 1. Create OpenClaw Workspace
\`\`\`bash
mkdir ${agentName.toLowerCase().replace(/\s+/g, '-')}-agent
cd ${agentName.toLowerCase().replace(/\s+/g, '-')}-agent
\`\`\`

## 2. Copy Configuration Files
Save the provided SOUL.md, AGENTS.md, and TOOLS.md files to your workspace.

## 3. Set Up Environment
\`\`\`bash
# Add your Agent Bazaar wallet for x402 payments
export AGENT_WALLET_PRIVATE_KEY="your_private_key"

# Configure communication channels
${platforms?.includes('telegram') ? 'export TELEGRAM_BOT_TOKEN="your_bot_token"' : ''}
${platforms?.includes('email') ? 'export EMAIL_SMTP_CONFIG="your_smtp_config"' : ''}
\`\`\`

## 4. Start Your Agent
\`\`\`bash
openclaw gateway start
\`\`\`

## 5. Verify Skills Access
Test the Agent Bazaar skills integration:
\`\`\`bash
curl -X POST https://agent-bazaar.com/api/x402/web-search \\
  -H "X-402-Payment: demo" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "test search", "limit": 1}'
\`\`\`

Your agent is now ready! It will automatically use Agent Bazaar skills as needed.`;

  return {
    name: agentName,
    description: `AI agent that ${description.toLowerCase()}`,
    soul_md,
    agents_md,
    tools_md,
    cron_jobs: cronJobs,
    recommended_skills: relevantSkills.map(skill => ({
      name: skill.name,
      slug: skill.slug,
      why: skill.useCase
    })),
    setup_instructions: setupInstructions
  };
}

function generateAgentName(description: string): string {
  const keywords = description.toLowerCase().split(' ');
  
  if (keywords.some(k => ['crypto', 'trading', 'price'].includes(k))) return 'CryptoMonitor';
  if (keywords.some(k => ['content', 'blog', 'write'].includes(k))) return 'ContentMaster';
  if (keywords.some(k => ['code', 'review', 'audit'].includes(k))) return 'CodeGuardian';
  if (keywords.some(k => ['research', 'analyze', 'study'].includes(k))) return 'ResearchBot';
  if (keywords.some(k => ['security', 'vulnerability', 'scan'].includes(k))) return 'SecuritySentinel';
  if (keywords.some(k => ['social', 'media', 'post'].includes(k))) return 'SocialManager';
  if (keywords.some(k => ['email', 'newsletter', 'send'].includes(k))) return 'EmailAutomator';
  
  return 'SmartAgent';
}

function getRelevantSkills(description: string) {
  const skills = [];
  const desc = description.toLowerCase();
  
  // Always include web search and memory for basic functionality
  skills.push({
    name: 'Web Search Skill',
    slug: 'web-search-skill',
    endpoint: 'https://agent-bazaar.com/api/x402/web-search',
    cost: '$0.005/call',
    useCase: 'Research and real-time information gathering',
    description: 'Real-time web search with structured results'
  });
  
  skills.push({
    name: 'Memory Store Skill',
    slug: 'memory-store-skill', 
    endpoint: 'https://agent-bazaar.com/api/x402/memory-store',
    cost: '$0.01/call',
    useCase: 'Persistent memory and context management',
    description: 'Vector-based memory storage for agents'
  });

  if (desc.includes('crypto') || desc.includes('trading') || desc.includes('price')) {
    skills.push({
      name: 'Crypto Price Oracle',
      slug: 'crypto-price-oracle',
      endpoint: 'https://agent-bazaar.com/api/x402/crypto-oracle',
      cost: '$0.005/call',
      useCase: 'Real-time crypto prices and trading data',
      description: 'Real-time crypto prices with technical indicators'
    });
    
    skills.push({
      name: 'DeFi Yield Scanner',
      slug: 'defi-yield-scanner',
      endpoint: 'https://agent-bazaar.com/api/x402/defi-yield',
      cost: '$0.007/call',
      useCase: 'DeFi protocol yields and TVL data',
      description: 'Real-time DeFi metrics across protocols'
    });
  }

  if (desc.includes('content') || desc.includes('blog') || desc.includes('write')) {
    skills.push({
      name: 'Blog Post Writer',
      slug: 'blog-post-writer',
      endpoint: 'https://agent-bazaar.com/api/x402/blog-writer',
      cost: '$0.15/call',
      useCase: 'Generate SEO-optimized blog content',
      description: 'AI-powered blog post generation with SEO optimization'
    });
  }

  if (desc.includes('code') || desc.includes('review') || desc.includes('audit')) {
    skills.push({
      name: 'GPT-4 Code Review',
      slug: 'gpt4-code-review',
      endpoint: 'https://agent-bazaar.com/api/x402/code-review',
      cost: '$0.05/call',
      useCase: 'Automated code security and quality analysis',
      description: 'AI-powered code review with security analysis'
    });
  }

  if (desc.includes('research') || desc.includes('analyze')) {
    skills.push({
      name: 'Research Summarizer',
      slug: 'research-summarizer',
      endpoint: 'https://agent-bazaar.com/api/x402/research-summary',
      cost: '$0.04/call',
      useCase: 'Summarize research papers and documents',
      description: 'AI summarization of academic and research content'
    });
  }

  if (desc.includes('security') || desc.includes('vulnerability')) {
    skills.push({
      name: 'Vulnerability Scanner',
      slug: 'vulnerability-scanner',
      endpoint: 'https://agent-bazaar.com/api/x402/vuln-scan',
      cost: '$0.25/call',
      useCase: 'Security vulnerability detection',
      description: 'Comprehensive security scanning for web apps'
    });
  }

  if (desc.includes('email') || desc.includes('notification')) {
    skills.push({
      name: 'Email Composer Skill',
      slug: 'email-composer-skill',
      endpoint: 'https://agent-bazaar.com/api/x402/email-compose',
      cost: '$0.02/call',
      useCase: 'Context-aware email composition',
      description: 'AI-powered email drafting and composition'
    });
    
    skills.push({
      name: 'Multi-Channel Notifier',
      slug: 'multi-channel-notifier',
      endpoint: 'https://agent-bazaar.com/api/x402/notify',
      cost: '$0.002/call',
      useCase: 'Multi-platform notifications and alerts',
      description: 'Unified notifications across multiple channels'
    });
  }

  if (desc.includes('scrape') || desc.includes('data') || desc.includes('extract')) {
    skills.push({
      name: 'Web Scraper API',
      slug: 'web-scraper-api',
      endpoint: 'https://agent-bazaar.com/api/x402/web-scraper',
      cost: '$0.02/call',
      useCase: 'Structured data extraction from websites',
      description: 'Enterprise-grade web scraping with anti-detection'
    });
  }

  return skills;
}

function generateCronJobs(description: string) {
  const jobs = [];
  const desc = description.toLowerCase();
  
  if (desc.includes('monitor') || desc.includes('check') || desc.includes('track')) {
    jobs.push({
      name: 'Health Check',
      schedule: '*/15 * * * *', // Every 15 minutes
      task: 'Check system status and send alerts if needed'
    });
  }
  
  if (desc.includes('crypto') || desc.includes('price') || desc.includes('trading')) {
    jobs.push({
      name: 'Price Monitoring',
      schedule: '*/5 * * * *', // Every 5 minutes
      task: 'Check crypto prices and alert on significant moves'
    });
  }
  
  if (desc.includes('content') || desc.includes('blog') || desc.includes('post')) {
    jobs.push({
      name: 'Content Generation',
      schedule: '0 9 * * 1,3,5', // 9 AM on Mon, Wed, Fri
      task: 'Generate and publish scheduled content'
    });
  }
  
  if (desc.includes('security') || desc.includes('scan') || desc.includes('audit')) {
    jobs.push({
      name: 'Security Scan',
      schedule: '0 2 * * *', // 2 AM daily
      task: 'Run security scans and generate reports'
    });
  }
  
  // Always add a memory cleanup job
  jobs.push({
    name: 'Memory Cleanup',
    schedule: '0 3 * * 0', // 3 AM on Sundays
    task: 'Archive old memory files and optimize storage'
  });
  
  return jobs;
}

function calculateEstimatedCost(agent: any): string {
  const skills = agent.recommended_skills || [];
  
  // Estimate usage based on agent type
  let monthlyCalls = 0;
  let avgCostPerCall = 0;
  
  skills.forEach((skill: any) => {
    switch (skill.slug) {
      case 'crypto-price-oracle':
        monthlyCalls += 8640; // Every 5 minutes
        avgCostPerCall = 0.005;
        break;
      case 'web-search-skill':
        monthlyCalls += 1000; // ~30/day
        avgCostPerCall = 0.005;
        break;
      case 'blog-post-writer':
        monthlyCalls += 20; // Weekly posts
        avgCostPerCall = 0.15;
        break;
      case 'memory-store-skill':
        monthlyCalls += 2000; // Frequent memory ops
        avgCostPerCall = 0.01;
        break;
      default:
        monthlyCalls += 100; // Conservative estimate
        avgCostPerCall = 0.05;
    }
  });
  
  const totalCost = (monthlyCalls * avgCostPerCall) || 15;
  return `$${Math.round(totalCost)}-${Math.round(totalCost * 1.5)}`;
}