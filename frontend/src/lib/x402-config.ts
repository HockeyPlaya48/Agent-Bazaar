export const X402_WALLET_ADDRESS = (
  process.env.X402_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000"
).trim();

export const X402_SOLANA_WALLET_ADDRESS = (
  process.env.X402_SOLANA_WALLET_ADDRESS || ""
).trim();

export const X402_PAYMENT_NETWORKS = X402_SOLANA_WALLET_ADDRESS
  ? ["base", "solana"]
  : ["base"];

export const X402_PAY_TO = {
  base: X402_WALLET_ADDRESS,
  ...(X402_SOLANA_WALLET_ADDRESS && { solana: X402_SOLANA_WALLET_ADDRESS }),
};
