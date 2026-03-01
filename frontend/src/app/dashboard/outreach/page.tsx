"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail, Twitter, ArrowLeft, RefreshCw, TrendingUp,
  Send, MessageSquare, Phone, CheckCircle2, XCircle,
  BarChart3, Eye, Heart, Repeat2, MousePointerClick,
  Plus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Types ──

interface OutreachContact {
  id: string;
  company: string;
  contact_email: string | null;
  twitter: string | null;
  status: "sent" | "replied" | "call_scheduled" | "integrated" | "no_response";
  sent_at: string | null;
  follow_up_at: string | null;
  notes: string | null;
  created_at: string;
}

interface SocialPost {
  id: string;
  platform: "x_personal" | "x_bazaar" | "instagram" | "tiktok";
  post_content: string | null;
  posted_at: string | null;
  impressions: number;
  likes: number;
  replies: number;
  reposts: number;
  clicks: number;
  notes: string | null;
  created_at: string;
}

// ── Helpers ──

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sent: { label: "Sent", color: "bg-blue-500/20 text-blue-400", icon: <Send size={14} /> },
  replied: { label: "Replied", color: "bg-green-500/20 text-green-400", icon: <MessageSquare size={14} /> },
  call_scheduled: { label: "Call Scheduled", color: "bg-purple-500/20 text-purple-400", icon: <Phone size={14} /> },
  integrated: { label: "Integrated", color: "bg-emerald-500/20 text-emerald-400", icon: <CheckCircle2 size={14} /> },
  no_response: { label: "No Response", color: "bg-zinc-500/20 text-zinc-400", icon: <XCircle size={14} /> },
};

const platformLabels: Record<string, string> = {
  x_personal: "𝕏 Personal",
  x_bazaar: "𝕏 Bazaar",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ── Component ──

export default function OutreachPage() {
  const [contacts, setContacts] = useState<OutreachContact[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/outreach"),
        fetch("/api/social-track"),
      ]);
      if (!cRes.ok || !pRes.ok) throw new Error("Failed to fetch data");
      setContacts(await cRes.json());
      setPosts(await pRes.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const statusCounts = contacts.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0);
  const totalEngagement = posts.reduce((s, p) => s + p.likes + p.replies + p.reposts, 0);
  const totalClicks = posts.reduce((s, p) => s + p.clicks, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-2 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Outreach & Social Tracking</h1>
          <p className="mt-1 text-zinc-400">Track partnership outreach and social post performance</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
          {error} — Make sure you&apos;ve run the SQL migration in Supabase.
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* OUTREACH TRACKER */}
      {/* ═══════════════════════════════════════ */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <Mail size={20} className="text-orange-400" />
          <h2 className="text-xl font-semibold">Partnership Outreach</h2>
          <Badge variant="default">{contacts.length} contacts</Badge>
        </div>

        {/* Status summary pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}: {statusCounts[key] || 0}
            </div>
          ))}
        </div>

        {/* Contact cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => {
            const sc = statusConfig[c.status];
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg">{c.company}</p>
                    {c.contact_email && (
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                        <Mail size={12} /> {c.contact_email}
                      </p>
                    )}
                    {c.twitter && (
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Twitter size={12} /> {c.twitter}
                      </p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${sc.color}`}>
                    {sc.icon} {sc.label}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                  <span>Sent {timeAgo(c.sent_at)}</span>
                  {c.follow_up_at && <span>Follow-up: {new Date(c.follow_up_at).toLocaleDateString()}</span>}
                </div>
                {c.notes && <p className="mt-2 text-xs text-zinc-400 italic">{c.notes}</p>}
              </Card>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SOCIAL ANALYTICS */}
      {/* ═══════════════════════════════════════ */}
      <section className="mt-14">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 size={20} className="text-blue-400" />
          <h2 className="text-xl font-semibold">Social Analytics</h2>
          <Badge variant="default">{posts.length} posts</Badge>
        </div>

        {/* Aggregate stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card>
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Eye size={14} /> Total Impressions
            </div>
            <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Heart size={14} /> Total Engagement
            </div>
            <p className="text-2xl font-bold">{totalEngagement.toLocaleString()}</p>
            <p className="text-xs text-zinc-500">Likes + replies + reposts</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <MousePointerClick size={14} /> Total Clicks
            </div>
            <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
          </Card>
        </div>

        {/* Posts table */}
        {posts.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
                    <th className="text-left py-3 px-2">Platform</th>
                    <th className="text-left py-3 px-2">Content</th>
                    <th className="text-left py-3 px-2">Posted</th>
                    <th className="text-right py-3 px-2"><Eye size={12} className="inline" /></th>
                    <th className="text-right py-3 px-2"><Heart size={12} className="inline" /></th>
                    <th className="text-right py-3 px-2"><MessageSquare size={12} className="inline" /></th>
                    <th className="text-right py-3 px-2"><Repeat2 size={12} className="inline" /></th>
                    <th className="text-right py-3 px-2"><MousePointerClick size={12} className="inline" /></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                      <td className="py-3 px-2">
                        <Badge variant="default">{platformLabels[p.platform] || p.platform}</Badge>
                      </td>
                      <td className="py-3 px-2 max-w-[200px] truncate text-zinc-300">{p.post_content || "—"}</td>
                      <td className="py-3 px-2 text-zinc-400 text-xs">{timeAgo(p.posted_at)}</td>
                      <td className="py-3 px-2 text-right font-mono">{p.impressions.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono">{p.likes.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono">{p.replies.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono">{p.reposts.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono">{p.clicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          !loading && (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-400">
              <Plus size={24} className="mx-auto mb-2 text-zinc-500" />
              <p>No social posts tracked yet.</p>
              <p className="text-xs mt-1">POST to /api/social-track to log your first post.</p>
            </div>
          )
        )}
      </section>
    </div>
  );
}
