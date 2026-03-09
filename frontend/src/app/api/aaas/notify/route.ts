/**
 * AaaS Notification Dispatcher
 * POST /api/aaas/notify
 *
 * Called internally after any purchase (x402 or Stripe).
 * Sends:
 *   1. Email to kenneytyler14@gmail.com (via Resend REST API)
 *   2. Proof-of-purchase email to buyer (via Resend)
 *   3. Tweet queued for @nexusx2026 (Supabase table + optional webhook)
 *
 * Env vars:
 *   RESEND_API_KEY          — Resend.com API key (free tier: 100 emails/day)
 *   RESEND_FROM_EMAIL       — verified sender (default: onboarding@resend.dev)
 *   NEXUSX2026_WEBHOOK_URL  — optional direct webhook to notify @nexusx2026
 *   INTERNAL_NOTIFY_KEY     — internal auth key (set to any secret string)
 *   TWITTER_API_KEY         — X Developer App API key (@nexusx2026)
 *   TWITTER_API_SECRET      — X Developer App API secret
 *   TWITTER_ACCESS_TOKEN    — @nexusx2026 OAuth 1.0a access token
 *   TWITTER_ACCESS_SECRET   — @nexusx2026 OAuth 1.0a access token secret
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[AaaS Notify] RESEND_API_KEY not set — email would go to: ${to}\nSubject: ${subject}`);
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL || "AaaS <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[AaaS Notify] Resend error:", data);
      return false;
    }
    console.log("[AaaS Notify] Email sent:", data.id);
    return true;
  } catch (err) {
    console.error("[AaaS Notify] Resend fetch failed:", err);
    return false;
  }
}

function buildOwnerEmail(payload: Record<string, any>): string {
  const { tier, tierConfig, fullName, email, xHandle, phone, automationDescription, txHash, amountUsd, paymentMethod, timestamp } = payload;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
  .badge { display: inline-block; background: #22c55e; color: #000; font-weight: 700; padding: 4px 12px; border-radius: 999px; font-size: 12px; margin-bottom: 16px; }
  h1 { color: #fff; font-size: 24px; margin: 0 0 24px; }
  .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .value { color: #fff; font-size: 15px; margin-bottom: 12px; }
  .tier-badge { background: #7c3aed; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; }
  .amount { color: #22c55e; font-size: 28px; font-weight: 700; }
  .description-box { background: #111; border: 1px solid #333; border-radius: 8px; padding: 16px; font-style: italic; color: #ccc; }
  .action-btn { display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
  .footer { color: #555; font-size: 12px; margin-top: 32px; border-top: 1px solid #222; padding-top: 16px; }
</style></head>
<body>
<div class="container">
  <div class="badge">NEW AAAS PURCHASE</div>
  <h1>New Automation Client Onboarded</h1>

  <div class="card">
    <div class="label">Tier</div>
    <div class="value"><span class="tier-badge">${tierConfig?.label || tier} — <span class="amount">$${amountUsd}/mo</span></span></div>

    <div class="label">Client Name</div>
    <div class="value">${fullName}</div>

    <div class="label">Client Email</div>
    <div class="value"><a href="mailto:${email}" style="color:#818cf8">${email}</a></div>

    <div class="label">X Handle</div>
    <div class="value">${xHandle || "Not provided"}</div>

    <div class="label">Phone</div>
    <div class="value">${phone || "Not provided"}</div>

    <div class="label">Payment Method</div>
    <div class="value">${paymentMethod}</div>

    <div class="label">Transaction / Session</div>
    <div class="value" style="font-family:monospace;font-size:12px;word-break:break-all">${txHash}</div>

    <div class="label">Timestamp</div>
    <div class="value">${timestamp}</div>
  </div>

  <div class="card">
    <div class="label">Automation Scope</div>
    <div class="description-box">${automationDescription}</div>
  </div>

  <p style="color:#e5e5e5">Relay this to <strong>@nexusx2026</strong> to begin the build. The client expects contact within 24 hours.</p>

  <a href="https://x.com/thebasedfrogx" class="action-btn">DM @nexusx2026 on X</a>

  <div class="footer">
    Sent by Agent Bazaar AaaS system · agent-bazaar.com<br>
    Reply-to: ${email}
  </div>
</div>
</body>
</html>`;
}

function buildBuyerEmail(payload: Record<string, any>): string {
  const { tier, tierConfig, fullName, txHash, amountUsd, purchaseId } = payload;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
  h1 { color: #fff; font-size: 22px; }
  .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .value { color: #fff; font-size: 15px; margin-bottom: 12px; }
  .check { color: #22c55e; font-size: 20px; }
  .purchase-id { font-family: monospace; background: #111; padding: 8px 12px; border-radius: 6px; color: #a78bfa; font-size: 14px; }
  .contact-block { background: #1e1b4b; border: 1px solid #3730a3; border-radius: 10px; padding: 16px; }
  .footer { color: #555; font-size: 12px; margin-top: 32px; border-top: 1px solid #222; padding-top: 16px; }
</style></head>
<body>
<div class="container">
  <p class="check">✅</p>
  <h1>Your AaaS Purchase is Confirmed, ${fullName}!</h1>
  <p style="color:#aaa">Thank you for choosing Automation-as-a-Service on Agent Bazaar. @nexusx2026's 19-agent system will begin building your automation shortly.</p>

  <div class="card">
    <div class="label">Purchase ID (save this)</div>
    <div class="purchase-id">${purchaseId || `AAAS-${tier?.toUpperCase()}-${Date.now()}`}</div>

    <div class="label" style="margin-top:12px">Tier</div>
    <div class="value">${tierConfig?.label || tier} — $${amountUsd}/mo</div>

    <div class="label">Payment Reference</div>
    <div class="value" style="font-family:monospace;font-size:11px;word-break:break-all">${txHash}</div>

    <div class="label">Expected Delivery</div>
    <div class="value">${tierConfig?.deliverables?.[tierConfig.deliverables.length - 1] || "See tier details"}</div>
  </div>

  <div class="contact-block">
    <p style="margin:0 0 8px;font-weight:600;color:#c4b5fd">Next Steps — Contact @thebasedfrogx</p>
    <p style="margin:0 0 8px;color:#aaa;font-size:14px">Reach out with your purchase ID to finalize your scope:</p>
    <p style="margin:0 0 6px"><strong>X DM:</strong> <a href="https://x.com/thebasedfrogx" style="color:#818cf8">@thebasedfrogx</a></p>
    <p style="margin:0 0 6px"><strong>Phone/Text:</strong> (207) 745-5876</p>
    <p style="margin:0"><strong>Email:</strong> <a href="mailto:kenneytyler14@gmail.com" style="color:#818cf8">kenneytyler14@gmail.com</a></p>
  </div>

  <div class="footer">
    Agent Bazaar AaaS · agent-bazaar.com · Powered by @nexusx2026
  </div>
</div>
</body>
</html>`;
}

function buildNexusTweet(payload: Record<string, any>): string {
  const { tier, automationDescription } = payload;
  // Privacy-safe: only describe the category, not the buyer
  const desc = automationDescription.length > 60
    ? automationDescription.slice(0, 57) + "..."
    : automationDescription;
  const tierLabel = tier === "premium" ? "🔥 Premium" : tier === "standard" ? "⚡ Standard" : "Basic";
  return `New AaaS client onboarded! Automating: "${desc}" — ${tierLabel} tier. Delivering end-to-end via @AgentBazaarX. #AIAgents #Automation #NexusX2026 #AgentBazaar`;
}

async function postTweetViaXApi(text: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const apiKey        = process.env.TWITTER_API_KEY;
  const apiSecret     = process.env.TWITTER_API_SECRET;
  const accessToken   = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret  = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { success: false, error: "Twitter credentials not configured" };
  }

  try {
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken,
      accessSecret,
    });
    const { data } = await client.v2.tweet(text);
    return { success: true, tweetId: data.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unknown Twitter error" };
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Internal auth
  const internalKey = request.headers.get("X-Internal-Key");
  const expectedKey = process.env.INTERNAL_NOTIFY_KEY || "aaas-internal";
  if (internalKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, any>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    tier, tierConfig, fullName, email, xHandle, phone,
    automationDescription, txHash, amountUsd, paymentMethod, timestamp,
  } = payload;

  const purchaseId = `AAAS-${(tier || "").toUpperCase()}-${Date.now()}`;
  const notifyPayload = { ...payload, purchaseId };

  const results: Record<string, any> = { purchaseId };

  // ── 1. Email to owner (kenneytyler14@gmail.com) ───────────────────────────
  const ownerEmailSent = await sendEmailViaResend(
    "kenneytyler14@gmail.com",
    `🚀 New AaaS Client: ${tierConfig?.label || tier} — $${amountUsd}/mo — ${fullName}`,
    buildOwnerEmail(notifyPayload)
  );
  results.ownerEmail = ownerEmailSent ? "sent" : "queued (no RESEND_API_KEY)";

  // ── 2. Proof of purchase email to buyer ───────────────────────────────────
  if (email) {
    const buyerEmailSent = await sendEmailViaResend(
      email,
      "Your AaaS Purchase is Confirmed — Agent Bazaar",
      buildBuyerEmail(notifyPayload)
    );
    results.buyerEmail = buyerEmailSent ? "sent" : "queued (no RESEND_API_KEY)";
  }

  // ── 3. Post tweet via X API + queue to Supabase ──────────────────────────
  const tweetText = buildNexusTweet(notifyPayload);
  results.tweet = { text: tweetText, queued: false };

  // Post directly via @nexusx2026's credentials
  const tweetResult = await postTweetViaXApi(tweetText);
  if (tweetResult.success) {
    results.tweet.posted = true;
    results.tweet.tweetId = tweetResult.tweetId;
    console.log(`[AaaS Tweet] Posted: https://x.com/nexusx2026/status/${tweetResult.tweetId}`);
  } else {
    results.tweet.posted = false;
    results.tweet.postError = tweetResult.error;
    console.error("[AaaS Tweet] Direct post failed:", tweetResult.error);
  }

  // Also queue to Supabase (audit log + fallback)
  try {
    const supabase = getSupabase();
    await supabase.from("nexus_tweet_queue").insert({
      tweet_text: tweetText,
      event_type: "new_aaas_purchase",
      purchase_id: purchaseId,
      tier,
      status: tweetResult.success ? "posted" : "pending",
      posted_at: tweetResult.success ? new Date().toISOString() : null,
      tweet_id: tweetResult.tweetId || null,
      created_at: new Date().toISOString(),
    });
    results.tweet.queued = true;
  } catch {
    console.log(`[AaaS Tweet Queue fallback]\n${tweetText}`);
  }

  // ── 4. Notify @nexusx2026 via webhook (if configured) ────────────────────
  const nexusWebhook = process.env.NEXUSX2026_WEBHOOK_URL;
  if (nexusWebhook) {
    try {
      await fetch(nexusWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "new_aaas_client",
          purchaseId,
          tier,
          tierConfig,
          scope: automationDescription,
          client: { fullName, email, xHandle, phone },
          tweetText,
          timestamp,
        }),
      });
      results.nexusWebhook = "notified";
    } catch {
      results.nexusWebhook = "webhook call failed";
    }
  } else {
    results.nexusWebhook = "NEXUSX2026_WEBHOOK_URL not configured";
  }

  return NextResponse.json({ success: true, purchaseId, notifications: results });
}

// GET — status check
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/aaas/notify",
    description: "Internal AaaS notification dispatcher",
    requires: "X-Internal-Key header",
    sends: ["email to owner", "proof-of-purchase to buyer", "tweet queued for @nexusx2026"],
  });
}
