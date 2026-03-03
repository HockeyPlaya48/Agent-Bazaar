"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Clock, Star, Users, Zap } from "lucide-react";
import Link from "next/link";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  
  // Real data - will populate as skills get actual usage
  const analytics = {
    totalCalls: 0,
    revenue: 0,
    avgLatency: 0,
    successRate: 0,
    skillsPublished: 115,
    totalDevelopers: 0
  };

  const chartData = [
    { day: "Mon", calls: 0, revenue: 0 },
    { day: "Tue", calls: 0, revenue: 0 },
    { day: "Wed", calls: 0, revenue: 0 },
    { day: "Thu", calls: 0, revenue: 0 },
    { day: "Fri", calls: 0, revenue: 0 },
    { day: "Sat", calls: 0, revenue: 0 },
    { day: "Sun", calls: 0, revenue: 0 }
  ];

  const topSkills: { name: string; calls: number; revenue: number; growth: number }[] = [];

  const recentCalls: { timestamp: string; skill: string; amount: string; status: string }[] = [];

  const maxCalls = Math.max(...chartData.map(d => d.calls));
  const maxRevenue = Math.max(...chartData.map(d => d.revenue));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          
          {/* Header */}
          <FadeInUp>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
              <p className="mt-2 text-lg text-zinc-400">
                Track your skills' performance — completely free
              </p>
            </div>
          </FadeInUp>

          {/* Time Range Selector */}
          <FadeInUp delay={0.1}>
            <div className="mb-8 flex gap-2">
              {[
                { value: "24h", label: "24 Hours" },
                { value: "7d", label: "7 Days" },
                { value: "30d", label: "30 Days" },
                { value: "90d", label: "90 Days" }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    timeRange === range.value
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </FadeInUp>

          {/* Key Metrics */}
          <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-12">
            {[
              { 
                title: "Total Calls", 
                value: analytics.totalCalls.toLocaleString(), 
                icon: <TrendingUp size={24} />, 
                color: "text-blue-400",
                change: "+12%"
              },
              { 
                title: "Revenue", 
                value: `$${analytics.revenue.toFixed(2)}`, 
                icon: <DollarSign size={24} />, 
                color: "text-green-400",
                change: "+8%"
              },
              { 
                title: "Avg Latency", 
                value: `${analytics.avgLatency}ms`, 
                icon: <Clock size={24} />, 
                color: "text-yellow-400",
                change: "-3ms"
              },
              { 
                title: "Success Rate", 
                value: `${analytics.successRate}%`, 
                icon: <Star size={24} />, 
                color: "text-purple-400",
                change: "+0.2%"
              },
              { 
                title: "Skills Published", 
                value: analytics.skillsPublished.toString(), 
                icon: <Zap size={24} />, 
                color: "text-orange-400",
                change: "+2"
              },
              { 
                title: "Developers Using", 
                value: analytics.totalDevelopers.toLocaleString(), 
                icon: <Users size={24} />, 
                color: "text-cyan-400",
                change: "+47"
              }
            ].map((metric, i) => (
              <StaggerItem key={metric.title}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${metric.color}`}>
                      {metric.icon}
                    </div>
                    <span className="text-xs font-medium text-green-400">
                      {metric.change}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                    {metric.value}
                  </div>
                  <div className="text-sm text-zinc-500">{metric.title}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Usage Charts */}
          <div className="grid gap-8 lg:grid-cols-2 mb-12">
            
            {/* Calls Chart */}
            <FadeInUp delay={0.2}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Daily Calls</h3>
                <div className="flex items-end justify-between gap-2 h-48">
                  {chartData.map((data, i) => (
                    <div key={data.day} className="flex flex-col items-center flex-1">
                      <div className="relative w-full flex-1 flex flex-col justify-end">
                        <div
                          className="bg-blue-500 rounded-t transition-all duration-1000 ease-out"
                          style={{ 
                            height: `${(data.calls / maxCalls) * 100}%`,
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                      </div>
                      <div className="text-xs text-zinc-400 mt-2">{data.day}</div>
                      <div className="text-xs font-medium text-white">{data.calls}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInUp>

            {/* Revenue Chart */}
            <FadeInUp delay={0.3}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Daily Revenue</h3>
                <div className="flex items-end justify-between gap-2 h-48">
                  {chartData.map((data, i) => (
                    <div key={data.day} className="flex flex-col items-center flex-1">
                      <div className="relative w-full flex-1 flex flex-col justify-end">
                        <div
                          className="bg-green-500 rounded-t transition-all duration-1000 ease-out"
                          style={{ 
                            height: `${(data.revenue / maxRevenue) * 100}%`,
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                      </div>
                      <div className="text-xs text-zinc-400 mt-2">{data.day}</div>
                      <div className="text-xs font-medium text-white">${data.revenue}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInUp>
          </div>

          {/* Detailed Tables */}
          <div className="grid gap-8 lg:grid-cols-2">
            
            {/* Top Skills */}
            <FadeInUp delay={0.4}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Top Performing Skills</h3>
                <div className="space-y-4">
                  {topSkills.map((skill, i) => (
                    <div key={skill.name} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 text-sm font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-white">{skill.name}</div>
                          <div className="text-sm text-zinc-400">{skill.calls.toLocaleString()} calls</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-400">${skill.revenue.toFixed(2)}</div>
                        <div className="text-sm text-zinc-400">
                          <span className="text-green-400">+{skill.growth}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInUp>

            {/* Recent Activity */}
            <FadeInUp delay={0.5}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Calls</h3>
                <div className="space-y-3">
                  {recentCalls.map((call, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${call.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div>
                          <div className="text-sm font-medium text-white">{call.skill}</div>
                          <div className="text-xs text-zinc-500">{call.timestamp}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-white">{call.amount}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <Link 
                    href="/dashboard" 
                    className="text-sm text-orange-400 hover:text-orange-300 transition"
                  >
                    View all activity →
                  </Link>
                </div>
              </div>
            </FadeInUp>
          </div>

          {/* CTA Section */}
          <FadeInUp delay={0.6}>
            <div className="mt-12 text-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
              <h3 className="text-2xl font-bold text-white mb-3">
                Want More Detailed Analytics?
              </h3>
              <p className="text-zinc-400 mb-6">
                All basic analytics are free. Advanced features coming soon.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/dev"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  List a New Skill
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-6 py-3 font-semibold text-zinc-300 transition hover:bg-zinc-800"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </FadeInUp>
        </div>
      </div>
    </div>
  );
}