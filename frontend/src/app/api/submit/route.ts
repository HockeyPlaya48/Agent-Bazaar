import { NextResponse } from "next/server";

// In-memory submissions (would be Supabase in prod)
const submissions: unknown[] = [];

// POST /api/submit — submit a new capability listing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, category, description, endpoint, pricePerCall, tags } = body;

    if (!name || !type || !category || !description || !endpoint || !pricePerCall) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: name, type, category, description, endpoint, pricePerCall" 
      }, { status: 400 });
    }

    const submission = {
      id: `sub_${Date.now()}`,
      name,
      type,
      category,
      description,
      endpoint,
      pricePerCall: parseFloat(pricePerCall),
      tags: tags || [],
      status: "pending_review",
      submittedAt: new Date().toISOString(),
    };

    submissions.push(submission);

    return NextResponse.json({
      success: true,
      message: "Capability submitted for review. We'll verify the endpoint and list it within 24 hours.",
      submission: { id: submission.id, status: submission.status },
      timestamp: Date.now(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// GET /api/submit — list all submissions (for admin)
export async function GET() {
  return NextResponse.json({ success: true, submissions, total: submissions.length });
}
