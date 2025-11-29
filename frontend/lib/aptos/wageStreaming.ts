import { aptos, MODULES, CONTRACT_ADDRESS, STREAM_STATUS } from "./config";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Types
export interface StreamInfo {
  streamId: string;
  employer: string;
  employee: string;
  ratePerSecond: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  startTime: number;
  endTime: number;
  status: number;
}

export interface StreamDetails {
  streamInfo: StreamInfo;
  withdrawableBalance: bigint;
  totalEarned: bigint;
  streamedAmount: bigint;
}

export interface RegistryStats {
  totalValueLocked: bigint;
  activeStreamsCount: bigint;
  completedStreamsCount: bigint;
  accumulatedFees: bigint;
}

// Stream Status Constants
export const STREAM_STATUS_CODES = {
  ACTIVE: 1,
  PAUSED: 2,
  COMPLETED: 3,
  TERMINATED: 4,
  DISPUTED: 5,
} as const;

// ============ VIEW FUNCTIONS ============

/**
 * Get stream information by stream ID
 */
export const getStreamInfo = async (
  registryAddr: string,
  streamId: number
): Promise<StreamInfo | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.WAGE_STREAMING}::get_stream_info`,
        functionArguments: [registryAddr, streamId],
      },
    });
    
    const [employer, employee, ratePerSecond, totalDeposited, totalWithdrawn, startTime, endTime, status] = 
      result as [string, string, string, string, string, string, string, number];
    
    return {
      streamId: streamId.toString(),
      employer,
      employee,
      ratePerSecond: BigInt(ratePerSecond),
      totalDeposited: BigInt(totalDeposited),
      totalWithdrawn: BigInt(totalWithdrawn),
      startTime: Number(startTime),
      endTime: Number(endTime),
      status,
    };
  } catch (error) {
    console.error("Error fetching stream info:", error);
    return null;
  }
};

/**
 * Get withdrawable balance for a stream
 */
export const getWithdrawableBalance = async (
  registryAddr: string,
  streamId: number
): Promise<bigint> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.WAGE_STREAMING}::get_withdrawable_balance`,
        functionArguments: [registryAddr, streamId],
      },
    });
    return BigInt(result[0] as string);
  } catch (error) {
    console.error("Error fetching withdrawable balance:", error);
    return BigInt(0);
  }
};

/**
 * Get registry statistics
 */
export const getRegistryStats = async (
  registryAddr: string
): Promise<RegistryStats | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.WAGE_STREAMING}::get_registry_stats`,
        functionArguments: [registryAddr],
      },
    });
    
    const [totalValueLocked, activeStreamsCount, completedStreamsCount, accumulatedFees] = 
      result as [string, string, string, string];
    
    return {
      totalValueLocked: BigInt(totalValueLocked),
      activeStreamsCount: BigInt(activeStreamsCount),
      completedStreamsCount: BigInt(completedStreamsCount),
      accumulatedFees: BigInt(accumulatedFees),
    };
  } catch (error) {
    console.error("Error fetching registry stats:", error);
    return null;
  }
};

/**
 * Check if employee has active streams
 */
export const hasActiveStreams = async (employeeAddr: string): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.WAGE_STREAMING}::has_active_streams`,
        functionArguments: [employeeAddr],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking active streams:", error);
    return false;
  }
};

/**
 * Get real-time stream details including withdrawable balance
 */
export const getStreamDetails = async (
  registryAddr: string,
  streamId: number
): Promise<StreamDetails | null> => {
  try {
    const [streamInfo, withdrawableBalance] = await Promise.all([
      getStreamInfo(registryAddr, streamId),
      getWithdrawableBalance(registryAddr, streamId),
    ]);

    if (!streamInfo) return null;

    const now = Math.floor(Date.now() / 1000);
    const effectiveEndTime = Math.min(now, streamInfo.endTime);
    const duration = Math.max(0, effectiveEndTime - streamInfo.startTime);
    const totalEarned = BigInt(duration) * streamInfo.ratePerSecond / BigInt(100_000_000); // Account for precision
    const streamedAmount = totalEarned - streamInfo.totalWithdrawn;

    return {
      streamInfo,
      withdrawableBalance,
      totalEarned,
      streamedAmount,
    };
  } catch (error) {
    console.error("Error fetching stream details:", error);
    return null;
  }
};

/**
 * Get all streams for an employer
 */
export const getEmployerStreams = async (employerAddress: string): Promise<string[]> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.WAGE_STREAMING}::get_employer_streams`,
        functionArguments: [employerAddress],
      },
    });
    return result[0] as string[];
  } catch (error) {
    console.error("Error fetching employer streams:", error);
    return [];
  }
};

/**
 * Get all streams for an employee
 */
export const getEmployeeStreams = async (employeeAddress: string): Promise<string[]> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.WAGE_STREAMING}::get_employee_streams`,
        functionArguments: [employeeAddress],
      },
    });
    return result[0] as string[];
  } catch (error) {
    console.error("Error fetching employee streams:", error);
    return [];
  }
};

/**
 * Check if a stream exists
 */
export const streamExists = async (streamId: string): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.WAGE_STREAMING}::stream_exists`,
        functionArguments: [streamId],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking stream existence:", error);
    return false;
  }
};

// ============ TRANSACTION PAYLOADS ============

/**
 * Create a new wage stream
 */
export const createStreamPayload = (
  registryAddr: string,
  employee: string,
  totalAmount: bigint,
  durationSeconds: number,
  jobDescription: string = ""
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.WAGE_STREAMING}::create_stream`,
      functionArguments: [registryAddr, employee, totalAmount.toString(), durationSeconds, jobDescription],
    },
  };
};

/**
 * Pause a stream (employer only)
 */
export const pauseStreamPayload = (
  registryAddr: string,
  streamId: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.WAGE_STREAMING}::pause_stream`,
      functionArguments: [registryAddr, streamId],
    },
  };
};

/**
 * Resume a paused stream (employer only)
 */
export const resumeStreamPayload = (
  registryAddr: string,
  streamId: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.WAGE_STREAMING}::resume_stream`,
      functionArguments: [registryAddr, streamId],
    },
  };
};

/**
 * Terminate a stream (employer only)
 */
export const terminateStreamPayload = (
  registryAddr: string,
  streamId: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.WAGE_STREAMING}::terminate_stream`,
      functionArguments: [registryAddr, streamId],
    },
  };
};

/**
 * Withdraw wages from a stream (employee only)
 */
export const withdrawWagesPayload = (
  registryAddr: string,
  streamId: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.WAGE_STREAMING}::withdraw_wages`,
      functionArguments: [registryAddr, streamId],
    },
  };
};

/**
 * Withdraw all available wages from all streams (employee only)
 */
export const withdrawAllPayload = (registryAddr: string): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.WAGE_STREAMING}::withdraw_all`,
      functionArguments: [registryAddr],
    },
  };
};

/**
 * Set dispute status on a stream
 */
export const setDisputeStatusPayload = (
  registryAddr: string,
  streamId: number,
  disputeStatus: boolean
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.WAGE_STREAMING}::set_dispute_status`,
      functionArguments: [registryAddr, streamId, disputeStatus],
    },
  };
};
