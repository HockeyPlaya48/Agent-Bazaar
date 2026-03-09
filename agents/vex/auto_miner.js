const { ethers } = require("ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = "https://base-mainnet.public.blastapi.io";
const RPC_FALLBACK_URL = "https://base.llamarpc.com";
const CONTRACT_ADDRESS = "0x9632495bDb93FD6B0740Ab69cc6c71C9c01da4f0"; // GridMining

const ABI = [
    "function deploy(uint8[] calldata blockIds) external payable",
    "function claimETH() external",
    "function claimBEAN() external",
    "function getCurrentRoundInfo() external view returns (uint64 roundId, uint64 startTime, uint64 endTime, uint256 totalDeployed, uint64 timeRemaining, bool isActive)",
    "function getPendingETH(address miner) external view returns (uint256)",
    "function getPendingBEAN(address miner) external view returns (uint256)",
    "function getMinerInfo(address miner) external view returns (uint256 totalDeployed, uint256 pendingETH, uint256 pendingBEAN, uint256 roastingBEAN)",
    "function getTotalPendingRewards(address miner) external view returns (uint256 totalETH, uint256 totalBEAN)",
    "function getRound(uint64 roundId) external view returns (uint64 startTime, uint64 endTime, uint256 totalDeployed, bool isActive)"
];

// ==========================================
// --- VOLUME BOOSTER CONFIGURATION ---
// ==========================================
const BET_AMOUNT_ETH = "0.0001"; // Amount to bet PER BLOCK
const NUM_RANDOM_BLOCKS = 3;     // How many random blocks to hit per round (Max 25)
// ==========================================

const LOOP_INTERVAL_SECONDS = 15;
const RETRY_DELAY_SECONDS = 5;

async function main() {
    console.log("--- BEAN GRINDER (Volume Booster) v1.1 ---");
    console.log(`Config: Targeting ${NUM_RANDOM_BLOCKS} random blocks at ${BET_AMOUNT_ETH} ETH each.`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const fallbackProvider = new ethers.JsonRpcProvider(RPC_FALLBACK_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    const initialRoundInfo = await contract.getCurrentRoundInfo();
    let lastPlayedRound = Number(initialRoundInfo[0]);
    console.log(`Initialized. Starting from Round ${lastPlayedRound}.`);

    while (true) {
        try {
            let roundInfo;
            let activeProvider = provider;
            let activeWallet = wallet;

            try {
                roundInfo = await contract.getCurrentRoundInfo();
            } catch (e) {
                console.warn("\nPrimary RPC failed. Trying fallback...");
                activeProvider = fallbackProvider;
                activeWallet = new ethers.Wallet(PRIVATE_KEY, fallbackProvider);
                const fallbackContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, activeWallet);
                roundInfo = await fallbackContract.getCurrentRoundInfo();
            }

            const [currentRoundId, , , , , isActive] = roundInfo;

            if (!isActive) {
                console.log("\nGame is not active. Waiting...");
                await new Promise(resolve => setTimeout(resolve, LOOP_INTERVAL_SECONDS * 4));
                continue;
            }

            if (Number(currentRoundId) > lastPlayedRound) {
                console.log(`\nNew Round Detected: Round ${currentRoundId}. Generating random targets...`);

                const targetBlocks = [];
                while (targetBlocks.length < NUM_RANDOM_BLOCKS) {
                    const randomBlock = Math.floor(Math.random() * 25);
                    if (!targetBlocks.includes(randomBlock)) {
                        targetBlocks.push(randomBlock);
                    }
                }

                console.log(`  -> Selected random blocks: [ ${targetBlocks.map(b => `#${b}`).join(", ")} ]`);

                const singleBet = ethers.parseEther(BET_AMOUNT_ETH);
                const totalAmount = singleBet * BigInt(targetBlocks.length);
                const feeData = await activeProvider.getFeeData();

                const activeContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, activeWallet);
                const tx = await activeContract.deploy(targetBlocks, {
                    value: totalAmount,
                    maxFeePerGas: feeData.maxFeePerGas,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
                });

                console.log(`  -> Deployed to ${targetBlocks.length} blocks with ${ethers.formatEther(totalAmount)} ETH total`);
                console.log(`  -> Tx: ${tx.hash}`);

                lastPlayedRound = Number(currentRoundId);

            } else {
                process.stdout.write(".");
            }
        } catch (error) {
            console.error("\nError in main loop:", error.message);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_SECONDS * 1000));
        }
        await new Promise(resolve => setTimeout(resolve, LOOP_INTERVAL_SECONDS * 1000));
    }
}

main();
