import { aptos, MODULES, CONTRACT_ADDRESS, shouldLogError, parseAptosError } from "./config";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Default gas settings for transactions
const DEFAULT_MAX_GAS = 200000;

// Types
export interface TreasuryInfo {
  owner: string;
  balance: bigint;
  allocatedBalance: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  isInitialized: boolean;
}

export interface TreasuryBalance {
  totalBalance: bigint;
  allocatedBalance: bigint;
  availableBalance: bigint;
  reserveBalance: bigint;
}

export interface TreasuryStatus {
  status: number;
  isFrozen: boolean;
  activeStreamCount: bigint;
}

export interface TreasuryAnalytics {
  totalDeposits: bigint;
  totalWithdrawals: bigint;
  totalDisbursements: bigint;
  peakBalance: bigint;
}

export interface TreasuryAllocation {
  amount: bigint;
  disbursed: bigint;
  isActive: boolean;
}

export interface TreasuryRegistryStats {
  totalTreasuries: bigint;
  totalValue: bigint;
  totalAllocated: bigint;
}

export interface TreasuryStats {
  activeStreams: number;
  totalAllocated: bigint;
  availableBalance: bigint;
}

// Treasury Status Constants
export const TREASURY_STATUS = {
  HEALTHY: 1,
  WARNING: 2,
  CRITICAL: 3,
  FROZEN: 4,
} as const;

// ============ VIEW FUNCTIONS ============

/**
 * Check if treasury exists for an employer
 */
export const treasuryExists = async (employerAddr: string): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMPLOYER_TREASURY}::treasury_exists`,
        functionArguments: [employerAddr],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking treasury existence:", error);
    return false;
  }
};

/**
 * Check if the treasury registry is initialized at a given address
 */
export const registryExists = async (registryAddr: string): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMPLOYER_TREASURY}::registry_exists`,
        functionArguments: [registryAddr],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    // If the view function doesn't exist, try checking if the resource exists
    console.error("Error checking registry existence:", error);
    return false;
  }
};

/**
 * Get treasury balance details
 * Returns null if the treasury hasn't been initialized yet
 */
export const getTreasuryBalance = async (employerAddr: string): Promise<TreasuryBalance | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMPLOYER_TREASURY}::get_treasury_balance`,
        functionArguments: [employerAddr],
      },
    });
    
    const [totalBalance, allocatedBalance, availableBalance, reserveBalance] = result as [string, string, string, string];
    
    return {
      totalBalance: BigInt(totalBalance),
      allocatedBalance: BigInt(allocatedBalance),
      availableBalance: BigInt(availableBalance),
      reserveBalance: BigInt(reserveBalance),
    };
  } catch (error) {
    if (shouldLogError(error)) {
      console.error("Error fetching treasury balance:", parseAptosError(error).message);
    }
    return null;
  }
};

/**
 * Get treasury status
 * Returns null if the treasury hasn't been initialized yet
 */
export const getTreasuryStatus = async (employerAddr: string): Promise<TreasuryStatus | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMPLOYER_TREASURY}::get_treasury_status`,
        functionArguments: [employerAddr],
      },
    });
    
    const [status, isFrozen, activeStreamCount] = result as [number, boolean, string];
    
    return {
      status,
      isFrozen,
      activeStreamCount: BigInt(activeStreamCount),
    };
  } catch (error) {
    if (shouldLogError(error)) {
      console.error("Error fetching treasury status:", parseAptosError(error).message);
    }
    return null;
  }
};

/**
 * Get treasury health ratio (available / total in basis points)
 * Returns 0 if the treasury hasn't been initialized yet
 */
export const getTreasuryHealth = async (employerAddr: string): Promise<bigint> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMPLOYER_TREASURY}::get_treasury_health`,
        functionArguments: [employerAddr],
      },
    });
    return BigInt(result[0] as string);
  } catch (error) {
    if (shouldLogError(error)) {
      console.error("Error fetching treasury health:", parseAptosError(error).message);
    }
    return BigInt(0);
  }
};

/**
 * Get allocation details for a stream
 * Returns null if the allocation doesn't exist
 */
export const getAllocation = async (
  employerAddr: string,
  streamId: number
): Promise<TreasuryAllocation | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMPLOYER_TREASURY}::get_allocation`,
        functionArguments: [employerAddr, streamId],
      },
    });
    
    const [amount, disbursed, isActive] = result as [string, string, boolean];
    
    return {
      amount: BigInt(amount),
      disbursed: BigInt(disbursed),
      isActive,
    };
  } catch (error) {
    if (shouldLogError(error)) {
      console.error("Error fetching allocation:", parseAptosError(error).message);
    }
    return null;
  }
};

/**
 * Get treasury analytics
 */
export const getTreasuryAnalytics = async (employerAddr: string): Promise<TreasuryAnalytics | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMPLOYER_TREASURY}::get_treasury_analytics`,
        functionArguments: [employerAddr],
      },
    });
    
    const [totalDeposits, totalWithdrawals, totalDisbursements, peakBalance] = result as [string, string, string, string];
    
    return {
      totalDeposits: BigInt(totalDeposits),
      totalWithdrawals: BigInt(totalWithdrawals),
      totalDisbursements: BigInt(totalDisbursements),
      peakBalance: BigInt(peakBalance),
    };
  } catch (error) {
    console.error("Error fetching treasury analytics:", error);
    return null;
  }
};

/**
 * Get registry statistics
 */
export const getTreasuryRegistryStats = async (registryAddr: string): Promise<TreasuryRegistryStats | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMPLOYER_TREASURY}::get_registry_stats`,
        functionArguments: [registryAddr],
      },
    });
    
    const [totalTreasuries, totalValue, totalAllocated] = result as [string, string, string];
    
    return {
      totalTreasuries: BigInt(totalTreasuries),
      totalValue: BigInt(totalValue),
      totalAllocated: BigInt(totalAllocated),
    };
  } catch (error) {
    console.error("Error fetching registry stats:", error);
    return null;
  }
};

/**
 * Get treasury information for an employer (combines balance and status)
 */
export const getTreasuryInfo = async (ownerAddress: string): Promise<TreasuryInfo | null> => {
  try {
    const [balance, status] = await Promise.all([
      getTreasuryBalance(ownerAddress),
      getTreasuryStatus(ownerAddress),
    ]);
    
    if (!balance) return null;
    
    return {
      owner: ownerAddress,
      balance: balance.totalBalance,
      allocatedBalance: balance.allocatedBalance,
      totalDeposited: balance.totalBalance, // Note: This is an approximation
      totalWithdrawn: BigInt(0), // Note: Need to get from analytics
      isInitialized: true,
    };
  } catch (error) {
    console.error("Error fetching treasury info:", error);
    return null;
  }
};

/**
 * Get available (unallocated) balance
 */
export const getAvailableBalance = async (ownerAddress: string): Promise<bigint> => {
  try {
    const balance = await getTreasuryBalance(ownerAddress);
    return balance?.availableBalance || BigInt(0);
  } catch (error) {
    console.error("Error fetching available balance:", error);
    return BigInt(0);
  }
};

/**
 * Get allocated balance for streams
 */
export const getAllocatedBalance = async (ownerAddress: string): Promise<bigint> => {
  try {
    const balance = await getTreasuryBalance(ownerAddress);
    return balance?.allocatedBalance || BigInt(0);
  } catch (error) {
    console.error("Error fetching allocated balance:", error);
    return BigInt(0);
  }
};

/**
 * Get treasury stats
 */
export const getTreasuryStats = async (ownerAddress: string): Promise<TreasuryStats | null> => {
  try {
    const [balance, status] = await Promise.all([
      getTreasuryBalance(ownerAddress),
      getTreasuryStatus(ownerAddress),
    ]);

    if (!balance) return null;

    return {
      activeStreams: status ? Number(status.activeStreamCount) : 0,
      totalAllocated: balance.allocatedBalance,
      availableBalance: balance.availableBalance,
    };
  } catch (error) {
    console.error("Error fetching treasury stats:", error);
    return null;
  }
};

/**
 * Check if treasury is initialized
 */
export const isTreasuryInitialized = async (ownerAddress: string): Promise<boolean> => {
  return treasuryExists(ownerAddress);
};

// ============ TRANSACTION PAYLOADS ============

/**
 * Initialize treasury for an employer with initial deposit
 */
export const initializeTreasuryPayload = (
  registryAddr: string,
  initialDeposit: bigint
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMPLOYER_TREASURY}::initialize_treasury`,
      functionArguments: [registryAddr, initialDeposit.toString()],
    },
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
    },
  };
};

/**
 * Deposit funds into treasury
 */
export const depositPayload = (
  registryAddr: string,
  amount: bigint
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMPLOYER_TREASURY}::deposit_funds`,
      functionArguments: [registryAddr, amount.toString()],
    },
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
    },
  };
};

/**
 * Withdraw funds from treasury
 */
export const withdrawPayload = (
  registryAddr: string,
  amount: bigint
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMPLOYER_TREASURY}::withdraw_funds`,
      functionArguments: [registryAddr, amount.toString()],
    },
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
    },
  };
};

/**
 * Allocate funds for a stream
 */
export const allocateForStreamPayload = (
  registryAddr: string,
  streamId: number,
  amount: bigint
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMPLOYER_TREASURY}::allocate_to_stream`,
      functionArguments: [registryAddr, streamId, amount.toString()],
    },
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
    },
  };
};

/**
 * Deallocate funds from a stream
 */
export const deallocateFromStreamPayload = (
  registryAddr: string,
  streamId: number,
  unusedAmount: bigint
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMPLOYER_TREASURY}::deallocate_from_stream`,
      functionArguments: [registryAddr, streamId, unusedAmount.toString()],
    },
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
    },
  };
};

/**
 * Emergency withdraw all funds
 */
export const emergencyWithdrawPayload = (registryAddr: string): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMPLOYER_TREASURY}::emergency_withdraw`,
      functionArguments: [registryAddr],
    },
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
    },
  };
};

/**
 * Set auto top-up threshold
 */
export const setAutoTopupThresholdPayload = (threshold: bigint): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMPLOYER_TREASURY}::set_auto_topup_threshold`,
      functionArguments: [threshold.toString()],
    },
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
    },
  };
};
