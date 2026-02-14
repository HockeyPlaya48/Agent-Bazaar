"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Key, Plus } from "lucide-react";
import { getUserAgents, type AgentListingAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AtlasCta } from "@/components/atlas-cta";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

export default function UserDashboard() {
  const [agents, setAgents] = useState<AgentListingAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserAgents("demo-user")
      .then(setAgents)
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Skeleton className="h-8 w-40" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-2xl font-bold">My Agents</h1>
        <p className="mt-1 text-zinc-400">{agents.length} agents purchased</p>
      </FadeInUp>

      {/* Agent Grid */}
      <StaggerContainer className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <StaggerItem key={agent.id}>
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <span className="text-4xl">{agent.icon}</span>
                <Badge variant="success">Active</Badge>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{agent.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{agent.description}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Settings size={14} />
                  Setup
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Key size={14} />
                  API Keys
                </Button>
              </div>
              {agent.atlas_compatible && (
                <p className="mt-3 text-[10px] text-blue-400">
                  Atlas-Compatible — upgrade to run autonomously
                </p>
              )}
            </Card>
          </StaggerItem>
        ))}

        <StaggerItem>
          <Link
            href="/"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-6 text-center transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-900/30"
          >
            <Plus size={32} className="text-zinc-500" />
            <p className="mt-2 text-sm text-zinc-400">Browse More Agents</p>
          </Link>
        </StaggerItem>
      </StaggerContainer>

      {/* Atlas Upsell */}
      <FadeInUp className="mt-12">
        <AtlasCta agentCount={agents.length} />
      </FadeInUp>

      {/* Purchase History */}
      <FadeInUp className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Purchase History</h2>
        {agents.length > 0 ? (
          <div className="space-y-2">
            {agents.map((agent) => (
              <Card key={agent.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{agent.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-zinc-500">
                      {agent.price_type === "lifetime" ? "Lifetime access" : "Free"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {agent.price === 0 ? "Free" : `$${agent.price}`}
                </span>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-zinc-500">No purchases yet.</p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-orange-400 transition-colors hover:text-orange-300"
            >
              Browse Agent Bazaar &rarr;
            </Link>
          </Card>
        )}
      </FadeInUp>
    </div>
  );
}
