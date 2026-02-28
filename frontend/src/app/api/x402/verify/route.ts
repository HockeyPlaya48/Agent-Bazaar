import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { base } from "viem/chains";
import { createClient } from "@supabase/supabase-js";

// Base USDC contract
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const USDC_DECIMALS = 6;

// ERC-20 Transfer event ABI
const ERC20_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

const baseClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// POST /api/x402/verify — Verify a USDC payment on Base
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { txHash, capabilityId, payerAddress } = body;

    if (!txHash) {
      return NextResponse.json({ error: "txHash is required" }, { status: 400 });
    }

    // 1. Get transaction receipt from Base
    const receipt = await baseClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (!receipt) {
      return NextResponse.json({ verified: false, error: "Transaction not found" }, { status: 404 });
    }

    if (receipt.status !== "success") {
      return NextResponse.json({ verified: false, error: "Transaction failed on-chain" }, { status: 400 });
    }

    // 2. Parse Transfer events from USDC contract
    const transferLogs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()
    );

    if (transferLogs.length === 0) {
      return NextResponse.json({ verified: false, error: "No USDC transfer found in transaction" }, { status: 400 });
    }

    // Decode the transfer
    let transferAmount = BigInt(0);
    let fromAddress = "";
    let toAddress = "";

    for (const log of transferLogs) {
      try {
        // Transfer event: topics[1]=from, topics[2]=to, data=value
        if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
          fromAddress = `0x${log.topics[1]?.slice(26)}`;
          toAddress = `0x${log.topics[2]?.slice(26)}`;
          transferAmount = BigInt(log.data);
        }
      } catch {}
    }

    const amountUsd = parseFloat(formatUnits(transferAmount, USDC_DECIMALS));

    // 3. Verify payer if provided
    if (payerAddress && fromAddress.toLowerCase() !== payerAddress.toLowerCase()) {
      return NextResponse.json({
        verified: false,
        error: "Payer address does not match transaction sender",
      }, { status: 400 });
    }

    // 4. Look up capability price if capabilityId provided
    let expectedPrice = 0;
    const supabase = getSupabase();

    if (capabilityId) {
      const { data: cap } = await supabase
        .from("capabilities")
        .select("price_per_call, provider_id")
        .eq("id", capabilityId)
        .single();

      if (cap) {
        expectedPrice = parseFloat(cap.price_per_call);
        if (amountUsd < expectedPrice) {
          return NextResponse.json({
            verified: false,
            error: `Insufficient payment. Expected $${expectedPrice}, got $${amountUsd}`,
            expected: expectedPrice,
            received: amountUsd,
          }, { status: 402 });
        }
      }
    }

    // 5. Check for duplicate payment
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("tx_hash", txHash)
      .single();

    if (existing) {
      return NextResponse.json({
        verified: false,
        error: "This transaction has already been used for a payment",
      }, { status: 409 });
    }

    // 6. Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        capability_id: capabilityId || null,
        payer_address: fromAddress,
        receiver_address: toAddress,
        tx_hash: txHash,
        network: "base",
        token: "USDC",
        amount_usd: amountUsd,
        amount_wei: transferAmount.toString(),
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Failed to record payment:", paymentError);
    }

    return NextResponse.json({
      verified: true,
      payment: {
        id: payment?.id,
        txHash,
        from: fromAddress,
        to: toAddress,
        amount: amountUsd,
        token: "USDC",
        network: "base",
        blockNumber: Number(receipt.blockNumber),
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { verified: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
