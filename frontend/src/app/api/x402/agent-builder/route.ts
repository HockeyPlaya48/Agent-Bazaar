import { X402_WALLET_ADDRESS } from "@/lib/x402-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// x402 payment config for this skill
const SKILL_CONFIG = {
  priceUsd: 0.25,
  payTo: X402_WALLET_ADDRESS,
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

  // Check for demo/test/stripe tokens BEFORE hitting blockchain verify
  const isDemoToken = paymentHeader === "demo" || paymentHeader === "test" || paymentHeader === "paid" || paymentHeader.startsWith("stripe_");
  
  if (!isDemoToken) {
    // Only verify on-chain for real tx hashes
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

      if (!verifyData.verified) {
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

  // DEMO MODE: Return preview/teaser only
  const isDemoMode = paymentHeader === "demo" || paymentHeader === "test";
  if (isDemoMode) {
    const agentName = name || "MyAgent";
    const demoAgent = {
      name: agentName,
      description: `Preview: ${description.slice(0, 100)}...`,
      soul_md: `# SOUL.md — ${agentName}\n\n## Who You Are\nYou are ${agentName}, an AI agent designed to help with: ${description.slice(0, 80)}...\n\n## Personality\n[Full personality, goals, and behavioral guidelines available in paid version]\n\n---\n*🔒 This is a demo preview. Pay $0.50 to get the complete, deployable agent configuration with detailed personality, tools, cron jobs, and Agent Bazaar skill integrations.*\n*→ agent-bazaar.com/build*`,
      agents_md: `# AGENTS.md — ${agentName}\n\n## Mission\nHelp the user with: ${description.slice(0, 80)}...\n\n## Memory & Workflow\n[Detailed memory instructions, workflow steps, and error handling available in paid version]\n\n---\n*🔒 Demo preview — upgrade for full agent configuration*`,
      tools_md: `# TOOLS.md — ${agentName}\n\n## Recommended Agent Bazaar Skills\n- [Skill recommendations tailored to your agent available in paid version]\n- [x402 endpoint URLs and integration code available in paid version]\n\n---\n*🔒 Demo preview — the paid version includes specific Agent Bazaar skills with endpoints, pricing, and integration examples*`,
      cron_jobs: [{ name: "Example Task", schedule: "*** locked ***", task: "Cron schedules available in paid version" }],
      recommended_skills: [{ name: "Upgrade to see recommendations", slug: "agent-builder", why: "Pay $0.50 to get tailored skill recommendations for your agent" }],
      setup_instructions: "🔒 Full setup instructions available in paid version.\n\nUpgrade at agent-bazaar.com/build to get:\n✅ Complete SOUL.md with detailed personality\n✅ Full AGENTS.md with workflow & memory\n✅ TOOLS.md with Agent Bazaar skill integrations\n✅ Configured cron job schedules\n✅ Step-by-step deployment guide",
    };

    return NextResponse.json({
      success: true,
      agent: demoAgent,
      demo: true,
      upgrade_url: "https://agent-bazaar.com/build",
      message: "This is a demo preview. Pay $0.50 to get the complete, deployable agent.",
      metadata: { skill: "ai-agent-builder", version: "1.0.0", engine: "demo-preview", billedAmount: 0 },
    });
  }

  // PAID MODE: Full AI-powered generation
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

## Agent Collaboration Features
When designing agents, consider how they can hire and collaborate with other specialized agents:

Available Specialized Agents for Collaboration:
- Content Writer Agent (content-writer-agent) - $0.50/hire - Creates blogs, social posts, marketing copy
- Sentiment Analysis Agent (sentiment-agent) - $0.25/hire - Analyzes text sentiment and emotions  
- Crypto Analyst Agent (crypto-analyst-agent) - $0.75/hire - Technical analysis, market research
- Code Reviewer Agent (code-reviewer-agent) - $0.40/hire - Security audits, code quality checks
- Social Media Manager Agent (social-manager-agent) - $0.60/hire - Multi-platform posting, engagement
- Research Assistant Agent (research-agent) - $0.35/hire - Data gathering, report generation
- Email Marketing Agent (email-marketing-agent) - $0.45/hire - Campaign creation, list management

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
  "collaborators": ["list of agent slugs this agent can hire for specialized tasks"],
  "hiring_budget": 50.00,
  "collaboration_workflow": "Description of how this agent collaborates with others",
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
  const collaborators = getRelevantCollaborators(description);
  const hiringBudget = estimateHiringBudget(description);
  const collaborationWorkflow = generateCollaborationWorkflow(description, collaborators);
  
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

# Set hiring budget for agent collaboration
export AGENT_HIRING_BUDGET="${hiringBudget}"
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

## 6. Test Agent Collaboration
If your agent uses collaborators, test hiring:
\`\`\`bash
curl -X POST https://agent-bazaar.com/api/x402/hire-agent \\
  -H "X-402-Payment: demo" \\
  -H "Content-Type: application/json" \\
  -d '{"agent": "content-writer-agent", "task": "Write a blog post about AI"}'
\`\`\`

Your agent is now ready! It will automatically use Agent Bazaar skills and hire specialized agents as needed.`;

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
    collaborators: collaborators,
    hiring_budget: hiringBudget,
    collaboration_workflow: collaborationWorkflow,
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
  const collaborators = agent.collaborators || [];
  
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
  
  // Add collaboration costs
  let collaborationCost = 0;
  collaborators.forEach((collab: string) => {
    switch (collab) {
      case 'content-writer-agent':
        collaborationCost += 15; // ~30 hires/month at $0.50
        break;
      case 'sentiment-agent':
        collaborationCost += 10; // ~40 hires/month at $0.25
        break;
      case 'crypto-analyst-agent':
        collaborationCost += 22.5; // ~30 hires/month at $0.75
        break;
      default:
        collaborationCost += 12; // Average collaboration cost
    }
  });
  
  const skillsCost = (monthlyCalls * avgCostPerCall) || 15;
  const totalCost = skillsCost + collaborationCost;
  
  return `$${Math.round(totalCost)}-${Math.round(totalCost * 1.2)}`;
}

function getRelevantCollaborators(description: string): string[] {
  const collaborators = [];
  const desc = description.toLowerCase();
  
  if (desc.includes('content') || desc.includes('blog') || desc.includes('social') || desc.includes('marketing')) {
    collaborators.push('content-writer-agent');
    collaborators.push('social-manager-agent');
  }
  
  if (desc.includes('sentiment') || desc.includes('analysis') || desc.includes('emotion') || desc.includes('feedback')) {
    collaborators.push('sentiment-agent');
  }
  
  if (desc.includes('crypto') || desc.includes('trading') || desc.includes('defi') || desc.includes('blockchain')) {
    collaborators.push('crypto-analyst-agent');
  }
  
  if (desc.includes('code') || desc.includes('security') || desc.includes('audit') || desc.includes('review')) {
    collaborators.push('code-reviewer-agent');
  }
  
  if (desc.includes('research') || desc.includes('data') || desc.includes('report') || desc.includes('analysis')) {
    collaborators.push('research-agent');
  }
  
  if (desc.includes('email') || desc.includes('newsletter') || desc.includes('campaign')) {
    collaborators.push('email-marketing-agent');
  }
  
  return collaborators;
}

function estimateHiringBudget(description: string): number {
  const desc = description.toLowerCase();
  
  // Base budget
  let budget = 25;
  
  if (desc.includes('content') || desc.includes('marketing')) {
    budget += 25; // Content creation requires more collaboration
  }
  
  if (desc.includes('analysis') || desc.includes('research')) {
    budget += 20; // Analysis tasks need specialist agents
  }
  
  if (desc.includes('trading') || desc.includes('crypto')) {
    budget += 30; // Financial agents need specialist analysis
  }
  
  if (desc.includes('enterprise') || desc.includes('business')) {
    budget += 40; // Business agents have higher budgets
  }
  
  return Math.min(budget, 100); // Cap at $100/month
}

function generateCollaborationWorkflow(description: string, collaborators: string[]): string {
  if (collaborators.length === 0) {
    return "This agent works independently using Agent Bazaar skills.";
  }
  
  const workflows: Record<string, string> = {
    'content-writer-agent': 'Hire for blog posts, social media content, and marketing copy when high-quality writing is needed.',
    'sentiment-agent': 'Hire to analyze user feedback, social media mentions, or customer communications for sentiment insights.',
    'crypto-analyst-agent': 'Hire for technical analysis, market research, and trading signal generation.',
    'code-reviewer-agent': 'Hire for security audits, code quality reviews, and vulnerability assessments.',
    'research-agent': 'Hire for comprehensive research, data gathering, and report generation.',
    'email-marketing-agent': 'Hire for email campaign creation, list management, and newsletter automation.',
    'social-manager-agent': 'Hire for multi-platform posting, engagement management, and social media strategy.'
  };
  
  const workflowSteps = collaborators.map(collab => workflows[collab] || 'Specialized task execution.').join(' ');
  
  return `This agent orchestrates a collaborative workflow: ${workflowSteps} All hiring is done automatically via x402 payments when specific expertise is needed.`;
}