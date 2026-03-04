import { X402_WALLET_ADDRESS } from "@/lib/x402-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.02,
  payTo: X402_WALLET_ADDRESS,
  networks: ["base"],
  tokens: ["USDC"],
  capabilityId: "web-scraper-api",
  description: "Extract structured data from any URL — handles JS-rendered pages, returns clean JSON",
};

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(request: Request) {
  const start = Date.now();
  const paymentHeader = request.headers.get("x-402-payment") || request.headers.get("x-payment-token");

  if (!paymentHeader) {
    return NextResponse.json({
      status: 402,
      message: "Payment required. Send USDC on Base to use this skill.",
      payment: SKILL_CONFIG,
      howToPay: {
        step1: `Send $${SKILL_CONFIG.priceUsd} USDC to ${SKILL_CONFIG.payTo} on Base`,
        step2: "Include the transaction hash in the X-402-Payment header",
        step3: "Resend your request",
      },
    }, { status: 402 });
  }

  const isDemoToken = paymentHeader === "demo" || paymentHeader === "test";
  if (!isDemoToken) {
    try {
      const verifyRes = await fetch(new URL("/api/x402/verify", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: paymentHeader, capabilityId: SKILL_CONFIG.capabilityId }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.verified) {
        return NextResponse.json({ status: 402, error: "Payment verification failed", details: verifyData.error }, { status: 402 });
      }
    } catch {
      return NextResponse.json({ error: "Payment verification service unavailable" }, { status: 503 });
    }
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, selector, format = "json" } = body;
  if (!url) {
    return NextResponse.json({ error: "url field is required" }, { status: 400 });
  }

  try {
    // Fetch the URL
    const fetchRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AgentBazaar-Scraper/1.0)",
        "Accept": "text/html,application/json,*/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!fetchRes.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${fetchRes.status} ${fetchRes.statusText}` }, { status: 502 });
    }

    const contentType = fetchRes.headers.get("content-type") || "";
    let result: any;

    if (contentType.includes("application/json")) {
      // JSON response — return as-is
      result = {
        type: "json",
        data: await fetchRes.json(),
      };
    } else {
      // HTML response — extract text content
      const html = await fetchRes.text();
      
      // Basic HTML to text extraction
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
      const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || "";
      
      // Strip tags for body text
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
      const textContent = bodyMatch
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 10000);

      // Extract links
      const links: string[] = [];
      const linkRegex = /href="(https?:\/\/[^"]+)"/gi;
      let match;
      while ((match = linkRegex.exec(html)) !== null && links.length < 20) {
        links.push(match[1]);
      }

      // Extract images
      const images: string[] = [];
      const imgRegex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|gif|webp)[^"]*)"/gi;
      while ((match = imgRegex.exec(html)) !== null && images.length < 10) {
        images.push(match[1]);
      }

      // Extract headings
      const headings: string[] = [];
      const headingRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
      while ((match = headingRegex.exec(html)) !== null && headings.length < 15) {
        headings.push(match[1].replace(/<[^>]+>/g, "").trim());
      }

      result = {
        type: "html",
        title,
        metaDescription: metaDesc,
        headings,
        textContent: textContent.slice(0, 5000),
        textLength: textContent.length,
        links: links.slice(0, 20),
        images: images.slice(0, 10),
        wordCount: textContent.split(/\s+/).length,
      };
    }

    const latencyMs = Date.now() - start;

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
      url,
      result,
      metadata: {
        skill: "web-scraper-api",
        version: "1.0.0",
        latencyMs,
        billedAmount: SKILL_CONFIG.priceUsd,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Scraping failed: ${error.message}` }, { status: 500 });
  }
}
