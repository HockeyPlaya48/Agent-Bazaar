"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Zap, TrendingUp, Plus, Copy, Check } from "lucide-react";
import { CAPABILITIES } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

// Mock: show a few capabilities as "your listed capabilities"
const myCapabilities = CAPABILITIES.slice(0, 3);

export default function DashboardPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyEndpoint(id: string, endpoint: string) {
    navigator.clipboard.writeText(endpoint);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totalCalls = myCapabilities.reduce((sum, c) => sum + c.usageCount, 0);
  const totalRevenue = myCapabilities.reduce((sum, c) => sum + c.usageCount * c.pricePerCall, 0);
  const avgRating = myCapabilities.reduce((sum, c) => sum + c.rating, 0) / myCapabilities.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Developer Dashboard</h1>
          <Badge variant="deal">
            Demo
          </Badge>
        </div>
        <p className="mt-1 text-zinc-400">Manage your listed skills and track performance. This is a demo dashboard showing sample data.</p>
      </FadeInUp>

      {/* Stats */}
      <StaggerContainer className="mt-8 grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <Card>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-400" />
              <p className="text-xs text-zinc-500">Total Revenue</p>
            </div>
            <p className="mt-2 text-3xl font-bold">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-zinc-400">Across {myCapabilities.length} capabilities</p>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-400" />
              <p className="text-xs text-zinc-500">Total API Calls</p>
            </div>
            <p className="mt-2 text-3xl font-bold">{totalCalls.toLocaleString()}</p>
            <p className="text-xs text-zinc-400">x402 pay-per-use</p>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              <p className="text-xs text-zinc-500">Avg Rating</p>
            </div>
            <p className="mt-2 text-3xl font-bold">{avgRating.toFixed(1)}</p>
            <p className="text-yellow-400 text-xs">{"★".repeat(Math.floor(avgRating))}</p>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Capabilities List */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Your Capabilities</h2>
        <StaggerContainer className="space-y-3">
          {myCapabilities.map((cap) => (
            <StaggerItem key={cap.id}>
              <Card className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cap.icon}</span>
                  <div>
                    <p className="font-medium">{cap.name}</p>
                    <p className="text-xs text-zinc-500">
                      {cap.usageCount.toLocaleString()} calls · ${cap.pricePerCall}/call · {cap.type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyEndpoint(cap.id, cap.x402Endpoint)}
                    className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-white"
                  >
                    {copiedId === cap.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === cap.id ? "Copied" : "Endpoint"}
                  </button>
                  <Badge variant="success">live</Badge>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Add More */}
      <FadeInUp className="mt-8">
        <Link
          href="/dev"
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 p-6 text-center transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-900/30"
        >
          <Plus size={20} className="text-zinc-500" />
          <span className="text-sm text-zinc-400">List a New Capability</span>
        </Link>
      </FadeInUp>
    </div>
  );
}
