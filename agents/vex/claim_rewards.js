const { ethers } = require("ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = "0x9632495bDb93FD6B0740Ab69cc6c71C9c01da4f0"; // GridMining

const ABI = [
    "function claimETH() external",
    "function claimBEAN() external",
    "function getPendingETH(address miner) external view returns (uint256)",
    "function getPendingBEAN(address miner) external view returns (uint256)"
];

async function main(claimType) {
    if (claimType !== 'eth' && claimType !== 'bean') {
        console.error("Invalid claim type. Use 'eth' or 'bean'.");
        process.exit(1);
    }

    console.log(`--- CLAIMING ${claimType.toUpperCase()} REWARDS ---`);
    const provider = new ethers.JsonRpcProvider("https://base-mainnet.public.blastapi.io");
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    try {
        let tx;
        if (claimType === 'eth') {
            tx = await contract.claimETH();
        } else {
            tx = await contract.claimBEAN();
        }

        console.log(`Claim transaction sent: ${tx.hash}`);
        console.log("Waiting for confirmation...");

        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

    } catch (error) {
        console.error("Error sending claim transaction:", error);
    }
}

const args = process.argv.slice(2);
const typeArg = args.find(arg => arg.startsWith('--type='));

if (typeArg) {
    main(typeArg.split('=')[1]);
} else {
    console.error("Usage: node claim_rewards.js --type=<eth|bean>");
}
