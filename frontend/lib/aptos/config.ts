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

// ==================== Error Code Definitions ====================

/**
 * Move contract error codes mapped to human-readable messages
 * Based on backend/sources/error_codes.move
 */
export const MOVE_ERROR_CODES: Record<number, { code: string; message: string; isExpected: boolean }> = {
  // Wage Streaming Errors (1000-1099)
  1000: { code: 'E_STREAM_NOT_FOUND', message: 'Stream not found', isExpected: true },
  1001: { code: 'E_STREAM_ALREADY_EXISTS', message: 'Stream already exists', isExpected: false },
  1002: { code: 'E_STREAM_NOT_ACTIVE', message: 'Stream is not active', isExpected: false },
  1003: { code: 'E_INSUFFICIENT_ACCRUED_WAGES', message: 'Insufficient accrued wages', isExpected: false },
  1004: { code: 'E_INVALID_WAGE_RATE', message: 'Invalid wage rate', isExpected: false },
  1005: { code: 'E_INVALID_TIMESTAMP', message: 'Invalid timestamp', isExpected: false },
  1006: { code: 'E_STREAM_PAUSED', message: 'Stream is paused', isExpected: false },
  1007: { code: 'E_STREAM_TERMINATED', message: 'Stream is terminated', isExpected: false },
  1008: { code: 'E_STREAM_ALREADY_PAUSED', message: 'Stream is already paused', isExpected: false },
  1009: { code: 'E_STREAM_NOT_PAUSED', message: 'Stream is not paused', isExpected: false },
  1010: { code: 'E_DUPLICATE_STREAM', message: 'Duplicate stream', isExpected: false },
  
  // Treasury Errors (1100-1199)
  1100: { code: 'E_INSUFFICIENT_TREASURY_BALANCE', message: 'Insufficient treasury balance', isExpected: false },
  1101: { code: 'E_INSUFFICIENT_SURPLUS', message: 'Insufficient surplus', isExpected: false },
  1102: { code: 'E_TREASURY_NOT_INITIALIZED', message: 'Treasury not initialized', isExpected: true },
  1103: { code: 'E_MINIMUM_DEPOSIT_NOT_MET', message: 'Minimum deposit not met', isExpected: false },
  1104: { code: 'E_TREASURY_ALREADY_INITIALIZED', message: 'Treasury already initialized', isExpected: false },
  1105: { code: 'E_TREASURY_LOCKED', message: 'Treasury is locked', isExpected: false },
  1106: { code: 'E_RESERVE_VIOLATION', message: 'Reserve violation', isExpected: false },
  
  // Compliance Errors (1200-1299)
  1200: { code: 'E_INVALID_COMPLIANCE_DATA', message: 'Invalid compliance data', isExpected: false },
  1201: { code: 'E_CERTIFICATE_NOT_FOUND', message: 'Certificate not found', isExpected: true },
  1202: { code: 'E_CERTIFICATE_EXPIRED', message: 'Certificate expired', isExpected: false },
  1203: { code: 'E_INVALID_TAX_REGIME', message: 'Invalid tax regime', isExpected: false },
  1204: { code: 'E_PAN_NOT_REGISTERED', message: 'PAN not registered', isExpected: true },
  1205: { code: 'E_FORM_GENERATION_FAILED', message: 'Form generation failed', isExpected: false },
  1206: { code: 'E_COMPLIANCE_RECORD_EXISTS', message: 'Compliance record exists', isExpected: false },
  
  // Dispute Errors (1300-1399)
  1300: { code: 'E_DISPUTE_NOT_FOUND', message: 'Dispute not found', isExpected: true },
  1301: { code: 'E_DISPUTE_ALREADY_RESOLVED', message: 'Dispute already resolved', isExpected: false },
  1302: { code: 'E_APPEAL_WINDOW_EXPIRED', message: 'Appeal window expired', isExpected: false },
  1303: { code: 'E_INSUFFICIENT_ESCROW', message: 'Insufficient escrow', isExpected: false },
  1304: { code: 'E_DISPUTE_AMOUNT_EXCEEDS_LIMIT', message: 'Dispute amount exceeds limit', isExpected: false },
  
  // Access Control Errors (1400-1499)
  1400: { code: 'E_UNAUTHORIZED', message: 'Unauthorized', isExpected: false },
  1401: { code: 'E_NOT_EMPLOYER', message: 'Not employer', isExpected: false },
  1402: { code: 'E_NOT_EMPLOYEE', message: 'Not employee', isExpected: false },
  1403: { code: 'E_NOT_ADMIN', message: 'Not admin', isExpected: false },
  
  // Input Validation Errors (1500-1599)
  1500: { code: 'E_INVALID_INPUT', message: 'Invalid input', isExpected: false },
  1501: { code: 'E_INVALID_AMOUNT', message: 'Invalid amount', isExpected: false },
  1502: { code: 'E_INVALID_ADDRESS', message: 'Invalid address', isExpected: false },
  1503: { code: 'E_ZERO_AMOUNT', message: 'Zero amount', isExpected: false },
  
  // Emergency/System Errors (1600-1699)
  1600: { code: 'E_SYSTEM_PAUSED', message: 'System is paused', isExpected: false },
  1601: { code: 'E_NOT_PAUSED', message: 'System is not paused', isExpected: false },
  1602: { code: 'E_COOLDOWN_ACTIVE', message: 'Cooldown active', isExpected: false },
  1605: { code: 'E_NOT_INITIALIZED', message: 'Registry not initialized', isExpected: true },
  1606: { code: 'E_ALREADY_INITIALIZED', message: 'Already initialized', isExpected: false },
};

/**
 * Parse an Aptos error to extract the error code and determine if it should be logged
 */
export const parseAptosError = (error: unknown): { 
  code: number | null; 
  message: string; 
  isExpected: boolean;
  shouldLog: boolean;
} => {
  if (!error || typeof error !== 'object') {
    return { code: null, message: 'Unknown error', isExpected: false, shouldLog: true };
  }
  
  const errorStr = JSON.stringify(error);
  const errorMessage = (error as Error)?.message || '';
  
  // Check for resource not found (various patterns)
  if (
    errorStr.includes('4008') || 
    errorStr.includes('Failed to borrow global resource') ||
    errorStr.includes('Resource not found') ||
    errorStr.includes('resource_not_found') ||
    errorStr.includes('RESOURCE_NOT_FOUND') ||
    errorMessage.includes('Resource not found') ||
    errorMessage.includes('resource_not_found') ||
    // Handle getAccountResource errors when resource doesn't exist
    errorStr.includes('error_code') && errorStr.includes('account_not_found') ||
    errorStr.includes('Table Item not found')
  ) {
    return { code: 4008, message: 'Resource not found', isExpected: true, shouldLog: false };
  }
  
  // Check for account not found
  if (errorStr.includes('account_not_found') || errorStr.includes('Account not found')) {
    return { code: 4008, message: 'Account not found', isExpected: true, shouldLog: false };
  }
  
  // Check for Move abort errors (vm_error_code field or hex in message)
  const vmErrorMatch = errorStr.match(/vm_error_code["\s:]+(\d+)/);
  const hexErrorMatch = errorStr.match(/0x([0-9a-fA-F]+)/);
  
  let errorCode: number | null = null;
  
  if (vmErrorMatch) {
    errorCode = parseInt(vmErrorMatch[1], 10);
  } else if (hexErrorMatch) {
    errorCode = parseInt(hexErrorMatch[1], 16);
  }
  
  if (errorCode !== null && MOVE_ERROR_CODES[errorCode]) {
    const knownError = MOVE_ERROR_CODES[errorCode];
    return {
      code: errorCode,
      message: knownError.message,
      isExpected: knownError.isExpected,
      shouldLog: !knownError.isExpected,
    };
  }
  
  // Unknown error - should be logged
  return { code: errorCode, message: errorMessage || 'Unknown error', isExpected: false, shouldLog: true };
};

/**
 * Check if an error is expected (shouldn't be logged as error)
 * Used for cases like "treasury not initialized" which are normal states
 */
export const isExpectedError = (error: unknown): boolean => {
  return parseAptosError(error).isExpected;
};

/**
 * Check if an error should be logged to console
 */
export const shouldLogError = (error: unknown): boolean => {
  return parseAptosError(error).shouldLog;
};
