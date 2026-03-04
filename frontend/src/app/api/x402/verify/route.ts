import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { base } from "viem/chains";
import { createClient } from "@supabase/supabase-js";

// Base USDC contract
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const USDC_DECIMALS = 6;

// Solana config
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC SPL token mint
const SOLANA_RECEIVER = "6YtDkQ1SfsZrWmy44Z749wSHj5tRZd48TVYnyyZHwu7b";

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

function isSolanaSignature(hash: string): boolean {
  // Solana tx signatures are base58, typically 87-88 chars, no 0x prefix
  return !hash.startsWith("0x") && hash.length >= 64 && hash.length <= 128;
}

async function verifySolanaPayment(txSignature: string): Promise<{
  verified: boolean;
  error?: string;
  from?: string;
  to?: string;
  amount?: number;
  blockNumber?: number;
}> {
  // Fetch transaction details from Solana RPC
  const response = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [txSignature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
    }),
  });

  const data = await response.json();

  if (!data.result) {
    return { verified: false, error: "Solana transaction not found" };
  }

  const tx = data.result;

  // Check transaction succeeded
  if (tx.meta?.err) {
    return { verified: false, error: "Solana transaction failed on-chain" };
  }

  // Look for USDC SPL token transfer to our receiver
  const innerInstructions = tx.meta?.innerInstructions || [];
  const outerInstructions = tx.transaction?.message?.instructions || [];
  const allInstructions = [
    ...outerInstructions,
    ...innerInstructions.flatMap((inner: { instructions: unknown[] }) => inner.instructions || []),
  ];

  // Also check pre/post token balances for the receiver
  const preBalances = tx.meta?.preTokenBalances || [];
  const postBalances = tx.meta?.postTokenBalances || [];

  // Find USDC balance changes for our receiver wallet
  let transferAmount = 0;
  let fromAddress = "";
  let toAddress = SOLANA_RECEIVER;
  let found = false;

  // Method 1: Check parsed instructions for SPL transfers
  for (const ix of allInstructions) {
    const parsed = (ix as { parsed?: { type?: string; info?: { authority?: string; source?: string; destination?: string; mint?: string; tokenAmount?: { uiAmount?: number }; amount?: string } } }).parsed;
    if (!parsed) continue;

    if (
      (parsed.type === "transfer" || parsed.type === "transferChecked") &&
      parsed.info
    ) {
      const info = parsed.info;
      // For transferChecked, verify mint is USDC
      if (parsed.type === "transferChecked" && info.mint !== SOLANA_USDC_MINT) continue;

      // We need to check if destination is our receiver's token account
      // The amount is in info.tokenAmount.uiAmount or info.amount (raw)
      const amount = info.tokenAmount?.uiAmount || (info.amount ? parseInt(info.amount) / 1e6 : 0);

      if (amount > 0) {
        transferAmount = amount;
        fromAddress = info.authority || info.source || "";
        found = true;
      }
    }
  }

  // Method 2: Check token balance changes if instruction parsing didn't find it
  if (!found) {
    for (const post of postBalances) {
      if (post.mint !== SOLANA_USDC_MINT) continue;
      if (post.owner !== SOLANA_RECEIVER) continue;

      const postAmount = parseFloat(post.uiTokenAmount?.uiAmountString || "0");

      // Find matching pre-balance
      const pre = preBalances.find(
        (p: { accountIndex: number }) => p.accountIndex === post.accountIndex
      );
      const preAmount = pre ? parseFloat(pre.uiTokenAmount?.uiAmountString || "0") : 0;

      const diff = postAmount - preAmount;
      if (diff > 0) {
        transferAmount = diff;
        toAddress = SOLANA_RECEIVER;
        found = true;

        // Try to find sender from other balance changes
        for (const preB of preBalances) {
          if (preB.mint !== SOLANA_USDC_MINT) continue;
          if (preB.owner === SOLANA_RECEIVER) continue;
          const postB = postBalances.find(
            (p: { accountIndex: number }) => p.accountIndex === preB.accountIndex
          );
          const postAmt = postB ? parseFloat(postB.uiTokenAmount?.uiAmountString || "0") : 0;
          const preAmt = parseFloat(preB.uiTokenAmount?.uiAmountString || "0");
          if (preAmt - postAmt >= diff * 0.99) {
            fromAddress = preB.owner || "";
            break;
          }
        }
        break;
      }
    }
  }

  if (!found || transferAmount === 0) {
    return { verified: false, error: "No USDC transfer to Agent Bazaar wallet found in transaction" };
  }

  return {
    verified: true,
    from: fromAddress,
    to: toAddress,
    amount: transferAmount,
    blockNumber: tx.slot,
  };
}

// POST /api/x402/verify — Verify a USDC payment on Base or Solana
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { txHash, capabilityId, payerAddress } = body;

    if (!txHash) {
      return NextResponse.json({ error: "txHash is required" }, { status: 400 });
    }

    const supabase = getSupabase();
    const isSolana = isSolanaSignature(txHash);

    // Check for duplicate payment first
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

    let fromAddress = "";
    let toAddress = "";
    let amountUsd = 0;
    let network = "";
    let blockNumber = 0;

    if (isSolana) {
      // ─── Solana verification ───
      network = "solana";
      const result = await verifySolanaPayment(txHash);

      if (!result.verified) {
        return NextResponse.json({ verified: false, error: result.error }, { status: 400 });
      }

      fromAddress = result.from || "";
      toAddress = result.to || SOLANA_RECEIVER;
      amountUsd = result.amount || 0;
      blockNumber = result.blockNumber || 0;
    } else {
      // ─── Base verification ───
      network = "base";
      const receipt = await baseClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      if (!receipt) {
        return NextResponse.json({ verified: false, error: "Transaction not found" }, { status: 404 });
      }

      if (receipt.status !== "success") {
        return NextResponse.json({ verified: false, error: "Transaction failed on-chain" }, { status: 400 });
      }

      // Parse Transfer events from USDC contract
      const transferLogs = receipt.logs.filter(
        (log) => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()
      );

      if (transferLogs.length === 0) {
        return NextResponse.json({ verified: false, error: "No USDC transfer found in transaction" }, { status: 400 });
      }

      let transferAmount = BigInt(0);
      for (const log of transferLogs) {
        try {
          if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
            fromAddress = `0x${log.topics[1]?.slice(26)}`;
            toAddress = `0x${log.topics[2]?.slice(26)}`;
            transferAmount = BigInt(log.data);
          }
        } catch {}
      }

      amountUsd = parseFloat(formatUnits(transferAmount, USDC_DECIMALS));
      blockNumber = Number(receipt.blockNumber);
    }

    // Verify payer if provided
    if (payerAddress && fromAddress.toLowerCase() !== payerAddress.toLowerCase()) {
      return NextResponse.json({
        verified: false,
        error: "Payer address does not match transaction sender",
      }, { status: 400 });
    }

    // Look up capability price if capabilityId provided
    if (capabilityId) {
      const { data: cap } = await supabase
        .from("capabilities")
        .select("price_per_call, provider_id")
        .eq("id", capabilityId)
        .single();

      if (cap) {
        const expectedPrice = parseFloat(cap.price_per_call);
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

    // Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        capability_id: capabilityId || null,
        payer_address: fromAddress,
        receiver_address: toAddress,
        tx_hash: txHash,
        network,
        token: "USDC",
        amount_usd: amountUsd,
        amount_wei: Math.round(amountUsd * 1e6).toString(),
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
        network,
        blockNumber,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Payment verification error:", error);
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json(
      { verified: false, error: message },
      { status: 500 }
    );
  }
}
