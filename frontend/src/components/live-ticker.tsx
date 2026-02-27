"use client";

import { useState, useEffect } from "react";

interface TickerEntry {
  id: string;
  icon: string;
  skillName: string;
  agentName: string;
  timeAgo: string;
}

const SKILLS = [
  { icon: "🔍", name: "GPT-4 Code Review" },
  { icon: "🎨", name: "DALL-E Image Gen" },
  { icon: "🕸️", name: "Web Scraper" },
  { icon: "📊", name: "CSV Intelligence" },
  { icon: "✍️", name: "Blog Post Writer" },
  { icon: "₿", name: "Crypto Price Oracle" },
  { icon: "🔬", name: "Research Summarizer" },
  { icon: "📧", name: "Email Composer" },
  { icon: "🧠", name: "Memory Store" },
  { icon: "🔎", name: "Web Search" },
  { icon: "🏦", name: "bankr-cli" },
  { icon: "⏰", name: "Scheduler" },
  { icon: "🗄️", name: "SQL Query Gen" },
  { icon: "🔐", name: "git-audit" },
  { icon: "🚀", name: "deploy-cli" },
  { icon: "📈", name: "SEO Analyzer" },
];

const AGENT_NAMES = [
  "agent-x42", "content-bot", "data-miner", "research-agent", "trade-bot",
  "dev-assistant", "seo-bot", "crypto-oracle", "memory-agent", "scheduler-ai",
  "web-crawler", "git-guardian", "deploy-master", "query-craft", "blog-ai"
];

function generateRandomEntry(): TickerEntry {
  const skill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
  const agent = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  const timeAgo = `${Math.floor(Math.random() * 30) + 3}s ago`;
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    icon: skill.icon,
    skillName: skill.name,
    agentName: agent,
    timeAgo
  };
}

export function LiveTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>([]);

  useEffect(() => {
    // Initialize with some entries
    const initialEntries = Array.from({ length: 8 }, generateRandomEntry);
    setEntries(initialEntries);

    // Add new entries periodically
    const interval = setInterval(() => {
      setEntries(prev => {
        const newEntry = generateRandomEntry();
        return [newEntry, ...prev.slice(0, 15)]; // Keep last 16 entries
      });
    }, 4000 + Math.random() * 2000); // Random interval between 4-6 seconds

    return () => clearInterval(interval);
  }, []);

  if (entries.length === 0) return null;

  const tickerContent = entries.map(entry => (
    `${entry.icon} <span class="text-orange-400 font-medium">${entry.skillName}</span> called by ${entry.agentName} · ${entry.timeAgo}`
  )).join(' | ');

  return (
    <div className="relative overflow-hidden bg-zinc-800 border-y border-zinc-700 py-2">
      <div className="flex">
        <div 
          className="flex whitespace-nowrap animate-scroll text-sm text-zinc-300"
          dangerouslySetInnerHTML={{ __html: `${tickerContent} | ${tickerContent}` }}
        />
      </div>
      
      {/* Fade gradients */}
      <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-zinc-800 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-zinc-800 to-transparent pointer-events-none" />
      
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
      `}</style>
    </div>
  );
}