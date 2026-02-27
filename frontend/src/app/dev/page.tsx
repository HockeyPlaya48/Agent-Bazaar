"use client";

import { useState } from "react";
import { CheckCircle, Zap, Globe, Terminal, Bot, Sparkles } from "lucide-react";
import { submitCapability, type CapabilitySubmitAPI } from "@/lib/api";
import { CATEGORIES } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CapabilityCard } from "@/components/capability-card";
import { FadeInUp, FadeIn } from "@/components/motion";

const TEMPLATES = {
  api: {
    name: "GPT-4 Text Analysis API",
    type: "api",
    category: "content-writing",
    description: "Extract sentiment, topics, and insights from any text. Built for content agents and marketing workflows.",
    price_per_call: 0.05,
    x402_endpoint: "https://api.example.com/x402/text-analysis",
  },
  cli: {
    name: "docker-optimize CLI",
    type: "cli", 
    category: "automation",
    description: "Analyze and optimize Docker images for size and security. One command to reduce image size by 60%+",
    price_per_call: 0.02,
    x402_endpoint: "https://api.example.com/x402/docker-optimize",
  },
  skill: {
    name: "Calendar Integration Skill",
    type: "skill",
    category: "automation", 
    description: "Give any agent calendar access. Create events, check availability, send meeting invites — composable via x402.",
    price_per_call: 0.03,
    x402_endpoint: "https://api.example.com/x402/calendar-skill",
  }
};

export default function ListCapabilityPage() {
  const [form, setForm] = useState<CapabilitySubmitAPI>({
    name: "",
    type: "api",
    category: "",
    description: "",
    price_per_call: 0,
    x402_endpoint: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadTemplate = (templateType: keyof typeof TEMPLATES) => {
    setForm(TEMPLATES[templateType]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(false);
    try {
      await submitCapability(form);
      setSubmitSuccess(true);
      setForm({ name: "", type: "api", category: "", description: "", price_per_call: 0, x402_endpoint: "" });
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <FadeInUp>
        <h1 className="text-3xl font-bold">List a Skill</h1>
        <p className="mt-2 text-zinc-400">
          Publish your API, CLI tool, or agent skill on Agent Bazaar. Set your price, get an x402 endpoint, and earn from every call — human or agent.
        </p>
      </FadeInUp>

      {/* Benefits */}
      <FadeInUp delay={0.1}>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: <Zap size={20} />, title: "x402 Payments", desc: "Get paid per call automatically" },
            { icon: <Globe size={20} />, title: "Human + Agent Discovery", desc: "Found by humans and AI agents" },
            { icon: <Bot size={20} />, title: "Zero Setup", desc: "We handle billing and discovery" },
          ].map((b) => (
            <Card key={b.title} className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
                {b.icon}
              </div>
              <h3 className="text-sm font-semibold">{b.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">{b.desc}</p>
            </Card>
          ))}
        </div>
      </FadeInUp>

      {/* Form */}
      <FadeIn>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-semibold">Skill Details</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Fill in the details. Submissions are reviewed within 48 hours.
              </p>

              {/* Templates */}
              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Sparkles size={16} />
                  Start from template
                </h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => loadTemplate('api')}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    📡 API Template
                  </Button>
                  <Button
                    type="button"
                    onClick={() => loadTemplate('cli')}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    💻 CLI Template
                  </Button>
                  <Button
                    type="button"
                    onClick={() => loadTemplate('skill')}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    🧠 Skill Template
                  </Button>
                </div>
              </div>

              {submitSuccess && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400">
                  <CheckCircle size={18} />
                  Skill submitted successfully! It will appear after review.
                </div>
              )}

              <div className="mt-6 space-y-4">
                <Input
                  label="Skill Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., GPT-4 Code Review API, Docker Optimizer CLI, Calendar Skill"
                  required
                />
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
              options={[
                { value: "api", label: "API Endpoint" },
                { value: "cli", label: "CLI Tool" },
                { value: "skill", label: "Agent Skill" },
              ]}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              options={[
                { value: "", label: "Select category" },
                ...CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` })),
              ]}
            />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Example: Automated sentiment analysis for customer feedback. Agents can analyze reviews, support tickets, and social media mentions to extract insights."
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Price per Call ($)"
                    type="number"
                    step="0.001"
                    value={form.price_per_call}
                    onChange={(e) => setForm({ ...form, price_per_call: Number(e.target.value) })}
                    placeholder="0.05"
                  />
                  <div>
                    <Input
                      label="x402 Endpoint URL (Optional)"
                      type="url"
                      value={form.x402_endpoint}
                      onChange={(e) => setForm({ ...form, x402_endpoint: e.target.value })}
                      placeholder="https://your-api.com/x402/endpoint"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">
                      We'll generate one for you if you don't have an x402 endpoint ready
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  className="w-full"
                >
                  Submit for Review
                </Button>
              </div>
            </form>
          </div>
          
          {/* Live Preview */}
          <div>
            <h3 className="text-lg font-semibold">Preview</h3>
            <p className="mt-1 text-sm text-zinc-400 mb-4">
              How your skill will appear in the marketplace
            </p>
            
            {form.name && (
              <div className="sticky top-6">
                <CapabilityCard 
                  capability={{
                    id: "preview",
                    name: form.name,
                    slug: form.name.toLowerCase().replace(/\s+/g, '-'),
                    description: form.description || "Add a description to see the full preview",
                    longDescription: form.description,
                    type: form.type as any,
                    category: form.category as any,
                    pricePerCall: form.price_per_call,
                    x402Endpoint: form.x402_endpoint,
                    icon: form.type === 'api' ? '🔗' : form.type === 'cli' ? '💻' : '🧠',
                    rating: 4.5,
                    usageCount: 0,
                    featured: false,
                    tags: [form.category, form.type],
                    creatorName: "You",
                    listingTier: undefined,
                  }}
                />
              </div>
            )}
            
            {!form.name && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                <div className="text-zinc-500 text-sm">
                  Start filling out the form to see your skill preview
                </div>
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
