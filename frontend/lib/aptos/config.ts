import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Contract address from environment variables
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xb51fa9b2858dccf17483aa110f2a64ee7177483d79f613c864c7f4a020e940ab";

// Network configuration from environment
const getNetwork = (): Network => {
  const network = process.env.NEXT_PUBLIC_APTOS_NETWORK?.toLowerCase();
  switch (network) {
    case "mainnet":
      return Network.MAINNET;
    case "devnet":
      return Network.DEVNET;
    case "testnet":
    default:
      return Network.TESTNET;
  }
};

export const NETWORK = getNetwork();

// Custom node URL if provided
const nodeUrl = process.env.NEXT_PUBLIC_APTOS_NODE_URL;

// Create Aptos client with optional custom endpoint
const config = new AptosConfig({
  network: NETWORK,
  ...(nodeUrl && { fullnode: nodeUrl }),
});
export const aptos = new Aptos(config);

// Module names
export const MODULES = {
  WAGE_STREAMING: `${CONTRACT_ADDRESS}::${process.env.NEXT_PUBLIC_WAGE_STREAMING_MODULE || "wage_streaming"}`,
  EMPLOYER_TREASURY: `${CONTRACT_ADDRESS}::${process.env.NEXT_PUBLIC_EMPLOYER_TREASURY_MODULE || "employer_treasury"}`,
  COMPLIANCE: `${CONTRACT_ADDRESS}::${process.env.NEXT_PUBLIC_COMPLIANCE_MODULE || "compliance"}`,
  DISPUTES: `${CONTRACT_ADDRESS}::${process.env.NEXT_PUBLIC_DISPUTES_MODULE || "disputes"}`,
  EMERGENCY: `${CONTRACT_ADDRESS}::${process.env.NEXT_PUBLIC_EMERGENCY_MODULE || "emergency"}`,
  PHOTON_REWARDS: `${CONTRACT_ADDRESS}::${process.env.NEXT_PUBLIC_PHOTON_REWARDS_MODULE || "photon_rewards"}`,
} as const;

// Faucet URL for testnet
export const FAUCET_URL =
  process.env.NEXT_PUBLIC_APTOS_FAUCET_URL ||
  "https://faucet.testnet.aptoslabs.com";

// Explorer URL based on network
export const getExplorerUrl = (address: string, type: "account" | "txn" = "account"): string => {
  const baseUrl = NETWORK === Network.MAINNET
    ? "https://explorer.aptoslabs.com"
    : `https://explorer.aptoslabs.com`;
  const networkParam = NETWORK === Network.MAINNET ? "" : `?network=${NETWORK.toLowerCase()}`;
  return `${baseUrl}/${type}/${address}${networkParam}`;
};

// Stream status codes
export const STREAM_STATUS = {
  ACTIVE: 0,
  PAUSED: 1,
  COMPLETED: 2,
  TERMINATED: 3,
} as const;

// Dispute types
export const DISPUTE_TYPES = {
  WAGE_UNDERPAYMENT: 0,
  WRONGFUL_TERMINATION: 1,
  WORK_NOT_COMPLETED: 2,
  QUALITY_ISSUES: 3,
  DELAYED_PAYMENT: 4,
  OTHER: 5,
} as const;

// Dispute status codes
export const DISPUTE_STATUS = {
  OPEN: 0,
  RESPONDED: 1,
  IN_ARBITRATION: 2,
  RULED: 3,
  APPEALED: 4,
  EXECUTED: 5,
  CANCELLED: 6,
} as const;

// Campaign types
export const CAMPAIGN_TYPES = {
  ATTENDANCE_BONUS: 0,
  PERFORMANCE_BONUS: 1,
  REFERRAL_BONUS: 2,
  MILESTONE_BONUS: 3,
  EARLY_BIRD: 4,
  LOYALTY_REWARD: 5,
} as const;

// Campaign status codes
export const CAMPAIGN_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PAUSED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

// State codes for compliance (Indian states)
export const STATE_CODES = {
  MAHARASHTRA: 1,
  KARNATAKA: 2,
  WEST_BENGAL: 3,
  ANDHRA_PRADESH: 4,
  TELANGANA: 5,
  TAMIL_NADU: 6,
  GUJARAT: 7,
  OTHER: 8,
} as const;

// Tax regime
export const TAX_REGIME = {
  OLD: 0,
  NEW: 1,
} as const;

// Utility function to convert octas to APT
export const octasToApt = (octas: number | bigint): number => {
  return Number(octas) / 100_000_000;
};

// Utility function to convert APT to octas
export const aptToOctas = (apt: number): bigint => {
  return BigInt(Math.floor(apt * 100_000_000));
};

// Format address for display
export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
