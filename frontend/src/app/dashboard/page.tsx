"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BarChart3, Zap, TrendingUp, Plus, Copy, Check, Clock, 
  Users, Eye, ChevronDown, ChevronUp, Activity, DollarSign,
  Star, Play, Pause, Hash, ExternalLink, Calendar, CheckCircle, AlertCircle
} from "lucide-react";
import { CAPABILITIES } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

// Mock data for the professional dashboard
const mockEarningsData = [
  { day: "Mon", amount: 124.50 },
  { day: "Tue", amount: 89.20 },
  { day: "Wed", amount: 156.80 },
  { day: "Thu", amount: 201.40 },
  { day: "Fri", amount: 178.90 },
  { day: "Sat", amount: 93.60 },
  { day: "Sun", amount: 142.30 }
];

const mockCallLogs = [
  { id: 1, timestamp: "2026-02-27 18:32:14", skill: "GPT-4 Code Review", caller: "agent", cost: 0.05, status: "success", latency: "1.2s" },
  { id: 2, timestamp: "2026-02-27 18:28:09", skill: "Web Scraper API", caller: "human", cost: 0.02, status: "success", latency: "2.8s" },
  { id: 3, timestamp: "2026-02-27 18:15:43", skill: "GPT-4 Code Review", caller: "agent", cost: 0.05, status: "fail", latency: "timeout" },
  { id: 4, timestamp: "2026-02-27 18:12:31", skill: "DALL-E Image Generator", caller: "agent", cost: 0.08, status: "success", latency: "3.4s" },
  { id: 5, timestamp: "2026-02-27 18:06:22", skill: "Web Scraper API", caller: "human", cost: 0.02, status: "success", latency: "1.9s" },
  { id: 6, timestamp: "2026-02-27 17:58:17", skill: "GPT-4 Code Review", caller: "agent", cost: 0.05, status: "success", latency: "0.9s" },
  { id: 7, timestamp: "2026-02-27 17:45:33", skill: "DALL-E Image Generator", caller: "human", cost: 0.08, status: "success", latency: "4.1s" },
  { id: 8, timestamp: "2026-02-27 17:32:11", skill: "Web Scraper API", caller: "agent", cost: 0.02, status: "success", latency: "2.3s" },
  { id: 9, timestamp: "2026-02-27 17:24:08", skill: "GPT-4 Code Review", caller: "agent", cost: 0.05, status: "success", latency: "1.5s" },
  { id: 10, timestamp: "2026-02-27 17:15:42", skill: "DALL-E Image Generator", caller: "human", cost: 0.08, status: "success", latency: "3.8s" },
  { id: 11, timestamp: "2026-02-27 17:08:29", skill: "Web Scraper API", caller: "agent", cost: 0.02, status: "success", latency: "1.7s" },
  { id: 12, timestamp: "2026-02-27 16:54:16", skill: "GPT-4 Code Review", caller: "human", cost: 0.05, status: "success", latency: "1.1s" },
];

const mockPayouts = [
  { id: 1, date: "2026-02-25", amount: 847.32, status: "paid", txHash: "0x1a2b3c...7f8g9h" },
  { id: 2, date: "2026-02-18", amount: 623.91, status: "paid", txHash: "0x2b3c4d...8g9h0i" },
  { id: 3, date: "2026-02-11", amount: 789.45, status: "paid", txHash: "0x3c4d5e...9h0i1j" },
  { id: 4, date: "2026-02-04", amount: 532.18, status: "pending", txHash: null },
];

const myCapabilities = CAPABILITIES.slice(0, 3);

export default function DashboardPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  function copyEndpoint(id: string, endpoint: string) {
    navigator.clipboard.writeText(endpoint);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totalCalls = myCapabilities.reduce((sum, c) => sum + c.usageCount, 0);
  const totalRevenue = myCapabilities.reduce((sum, c) => sum + c.usageCount * c.pricePerCall, 0);
  const avgRating = myCapabilities.reduce((sum, c) => sum + c.rating, 0) / myCapabilities.length;
  
  const todayCalls = {
    "24h": 1240,
    "7d": 8680,
    "30d": 37200
  };

  const conversionRate = 12.3; // Mock conversion rate
  const humanVsAgent = { human: 35, agent: 65 }; // Mock split

  // Simple inline SVG bar chart
  const maxEarning = Math.max(...mockEarningsData.map(d => d.amount));
  
  const sortedLogs = [...mockCallLogs].sort((a, b) => {
    const aVal = a[sortField as keyof typeof a];
    const bVal = b[sortField as keyof typeof b];
    
    if (sortField === "timestamp") {
      const comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    }
    
    if (sortField === "cost") {
      const comparison = Number(aVal) - Number(bVal);
      return sortOrder === "asc" ? comparison : -comparison;
    }
    
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          <Badge variant="deal">
            Demo Mode
          </Badge>
        </div>
        <p className="mt-2 text-zinc-400">Professional analytics and tools for Agent Bazaar providers. All data shown is for demonstration purposes.</p>
      </FadeInUp>

      {/* Top Stats Section */}
      <StaggerContainer className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StaggerItem>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-green-400" />
                <p className="text-xs text-zinc-500">Total Revenue</p>
              </div>
              <TrendingUp size={14} className="text-green-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-green-400">+12.5% vs last month</p>
          </Card>
        </StaggerItem>
        
        <StaggerItem>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-400" />
                <p className="text-xs text-zinc-500">API Calls</p>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <button 
                  onClick={() => setTimeRange("24h")} 
                  className={`px-2 py-1 rounded ${timeRange === "24h" ? "bg-blue-500/20 text-blue-400" : "text-zinc-500"}`}
                >
                  24h
                </button>
                <button 
                  onClick={() => setTimeRange("7d")} 
                  className={`px-2 py-1 rounded ${timeRange === "7d" ? "bg-blue-500/20 text-blue-400" : "text-zinc-500"}`}
                >
                  7d
                </button>
                <button 
                  onClick={() => setTimeRange("30d")} 
                  className={`px-2 py-1 rounded ${timeRange === "30d" ? "bg-blue-500/20 text-blue-400" : "text-zinc-500"}`}
                >
                  30d
                </button>
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">{todayCalls[timeRange].toLocaleString()}</p>
            <p className="text-xs text-blue-400">x402 pay-per-use</p>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-400" />
              <p className="text-xs text-zinc-500">Avg Rating</p>
            </div>
            <p className="mt-2 text-2xl font-bold">{avgRating.toFixed(1)}</p>
            <p className="text-yellow-400 text-xs">{"★".repeat(Math.floor(avgRating))}</p>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-purple-400" />
              <p className="text-xs text-zinc-500">Conversion Rate</p>
            </div>
            <p className="mt-2 text-2xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-zinc-400">Views → calls</p>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-orange-400" />
              <p className="text-xs text-zinc-500">Traffic Split</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-zinc-800 rounded-full h-2">
                <div 
                  className="bg-orange-400 h-2 rounded-full" 
                  style={{ width: `${humanVsAgent.human}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{humanVsAgent.human}% human, {humanVsAgent.agent}% agent</p>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Earnings Chart */}
      <FadeInUp className="mt-10">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Daily Earnings (Last 7 Days)</h2>
            <div className="text-sm text-zinc-400">Total: ${mockEarningsData.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}</div>
          </div>
          
          <div className="flex items-end justify-between gap-4 h-32">
            {mockEarningsData.map((day, i) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full">
                  <div 
                    className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-sm transition-all duration-500 ease-out"
                    style={{ 
                      height: `${(day.amount / maxEarning) * 100}px`,
                      minHeight: '4px'
                    }}
                  />
                </div>
                <div className="text-xs text-center">
                  <div className="font-medium">${day.amount.toFixed(0)}</div>
                  <div className="text-zinc-500">{day.day}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>

      {/* Call Logs Table */}
      <FadeInUp className="mt-10">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Call Logs</h2>
            <div className="text-sm text-zinc-400">Last 12 calls</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-2">
                    <button 
                      onClick={() => handleSort("timestamp")} 
                      className="flex items-center gap-1 text-zinc-400 hover:text-white"
                    >
                      Timestamp
                      {sortField === "timestamp" && (sortOrder === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </button>
                  </th>
                  <th className="text-left py-3 px-2">
                    <button 
                      onClick={() => handleSort("skill")} 
                      className="flex items-center gap-1 text-zinc-400 hover:text-white"
                    >
                      Skill
                      {sortField === "skill" && (sortOrder === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </button>
                  </th>
                  <th className="text-left py-3 px-2">
                    <button 
                      onClick={() => handleSort("caller")} 
                      className="flex items-center gap-1 text-zinc-400 hover:text-white"
                    >
                      Caller
                      {sortField === "caller" && (sortOrder === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </button>
                  </th>
                  <th className="text-left py-3 px-2">
                    <button 
                      onClick={() => handleSort("cost")} 
                      className="flex items-center gap-1 text-zinc-400 hover:text-white"
                    >
                      Cost
                      {sortField === "cost" && (sortOrder === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </button>
                  </th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Latency</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td className="py-3 px-2 text-zinc-400 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-2">{log.skill}</td>
                    <td className="py-3 px-2">
                      <Badge variant={log.caller === "human" ? "atlas" : "default"}>
                        {log.caller}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-mono">${log.cost}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        {log.status === "success" ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : (
                          <AlertCircle size={14} className="text-red-400" />
                        )}
                        <span className={log.status === "success" ? "text-green-400" : "text-red-400"}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs text-zinc-400">{log.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </FadeInUp>

      {/* My Skills Section */}
      <div className="mt-10">
        <h2 className="mb-6 text-lg font-semibold">My Skills</h2>
        <StaggerContainer className="space-y-4">
          {myCapabilities.map((cap) => (
            <StaggerItem key={cap.id}>
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{cap.icon}</span>
                    <div>
                      <p className="font-medium">{cap.name}</p>
                      <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                        <span>47 calls today</span>
                        <span>${(47 * cap.pricePerCall).toFixed(2)} today</span>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400" />
                          <span>{cap.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="success">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        live
                      </div>
                    </Badge>
                    
                    <button
                      onClick={() => copyEndpoint(cap.id, cap.x402Endpoint)}
                      className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-white"
                    >
                      {copiedId === cap.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === cap.id ? "Copied" : "Copy Endpoint"}
                    </button>
                    
                    <button
                      onClick={() => setExpandedSkill(expandedSkill === cap.id ? null : cap.id)}
                      className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-white"
                    >
                      <Activity size={12} />
                      Analytics
                      {expandedSkill === cap.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>
                
                {expandedSkill === cap.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500">24h Calls</p>
                        <p className="font-medium">47</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">7d Calls</p>
                        <p className="font-medium">312</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Success Rate</p>
                        <p className="font-medium text-green-400">98.2%</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Avg Latency</p>
                        <p className="font-medium">1.4s</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Payout History */}
      <FadeInUp className="mt-10">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Payout History</h2>
            <div className="text-sm text-zinc-400">Weekly automated payouts</div>
          </div>
          
          <div className="space-y-3">
            {mockPayouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-zinc-400" />
                  <div>
                    <p className="font-medium">${payout.amount.toFixed(2)}</p>
                    <p className="text-xs text-zinc-500">{payout.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant={payout.status === "paid" ? "success" : "default"}>
                    {payout.status}
                  </Badge>
                  
                  {payout.txHash && (
                    <button className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                      <Hash size={12} />
                      <span className="font-mono">{payout.txHash}</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>

      {/* Add More Skills */}
      <FadeInUp className="mt-8">
        <Link
          href="/dev"
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 p-6 text-center transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-900/30"
        >
          <Plus size={20} className="text-zinc-500" />
          <span className="text-sm text-zinc-400">List a New Skill</span>
        </Link>
      </FadeInUp>
    </div>
  );
}