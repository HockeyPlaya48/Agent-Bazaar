"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseUnits, encodeFunctionData } from "viem";
import { base } from "wagmi/chains";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const; // USDC on Base
const PAYMENT_WALLET = "0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906" as const;

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface PayUsdcButtonProps {
  priceUsd: number;
  skillSlug: string;
  onSuccess?: (txHash: string) => void;
}

export function PayUsdcButton({ priceUsd, skillSlug, onSuccess }: PayUsdcButtonProps) {
  const { isConnected } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const [callResult, setCallResult] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // After tx confirmed, call the skill endpoint
  if (isSuccess && txHash && !callResult && !calling) {
    setCalling(true);
    fetch(`/api/x402/${skillSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, query: "paid via USDC" }),
    })
      .then((r) => r.json())
      .then((data) => {
        setCallResult(JSON.stringify(data, null, 2));
        onSuccess?.(txHash);
      })
      .catch((e) => setCallResult(`Error: ${e.message}`))
      .finally(() => setCalling(false));
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20"
            >
              🔗 Connect Wallet to Pay USDC
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    );
  }

  const handlePay = () => {
    const amount = parseUnits(priceUsd.toFixed(6), 6); // USDC has 6 decimals
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [PAYMENT_WALLET, amount],
      chainId: base.id,
    });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handlePay}
        disabled={isPending || isConfirming}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
      >
        {isPending
          ? "⏳ Confirm in wallet..."
          : isConfirming
          ? "⏳ Confirming tx..."
          : `🔗 Pay ${priceUsd.toFixed(3)} USDC on Base`}
      </button>

      {isSuccess && txHash && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-xs">
          <p className="text-green-400 font-semibold">✓ Payment confirmed!</p>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline break-all"
          >
            View on BaseScan
          </a>
          {calling && <p className="mt-1 text-zinc-400">Calling skill endpoint...</p>}
          {callResult && (
            <pre className="mt-2 text-zinc-300 bg-zinc-900 rounded p-2 overflow-x-auto">
              {callResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
