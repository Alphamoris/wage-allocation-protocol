import { aptos, MODULES, CONTRACT_ADDRESS, STREAM_STATUS, shouldLogError, parseAptosError, isExpectedError } from "./config";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Default gas settings for transactions
const DEFAULT_MAX_GAS = 200000;

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
 * Returns null if the stream doesn't exist
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
    if (shouldLogError(error)) {
      console.error("Error fetching stream info:", parseAptosError(error).message);
    }
    return null;
  }
};

/**
 * Get withdrawable balance for a stream
 * Returns 0 if the stream doesn't exist
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
    if (shouldLogError(error)) {
      console.error("Error fetching withdrawable balance:", parseAptosError(error).message);
    }
    return BigInt(0);
  }
};

/**
 * Get registry statistics
 * Returns null if the registry hasn't been initialized
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
    if (shouldLogError(error)) {
      console.error("Error fetching registry stats:", parseAptosError(error).message);
    }
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
    if (shouldLogError(error)) {
      console.error("Error checking active streams:", parseAptosError(error).message);
    }
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
 * Reads the EmployerStreams resource from the employer's address
 */
export const getEmployerStreams = async (employerAddress: string): Promise<string[]> => {
  try {
    // EmployerStreams resource is stored at the employer's address
    const resource = await aptos.getAccountResource<{
      stream_ids: string[];
      total_allocated: string;
      total_disbursed: string;
    }>({
      accountAddress: employerAddress,
      resourceType: `${MODULES.WAGE_STREAMING}::EmployerStreams`,
    });
    
    return resource.stream_ids || [];
  } catch (error) {
    // Resource doesn't exist means no streams created yet
    if (isExpectedError(error)) {
      return [];
    }
    if (shouldLogError(error)) {
      console.error("Error fetching employer streams:", parseAptosError(error).message);
    }
    return [];
  }
};

/**
 * Get all streams for an employee  
 * Since EmployeeStreams resource is not created by the contract,
 * we need to read StreamStore and filter by employee address
 */
export const getEmployeeStreams = async (employeeAddress: string): Promise<string[]> => {
  try {
    // First, try to read the StreamStore from the contract address
    const streamStoreResource = await aptos.getAccountResource<{
      streams: Array<{
        stream_id: string;
        employer: string;
        employee: string;
        rate_per_second: string;
        total_deposited: string;
        total_withdrawn: string;
        start_time: string;
        end_time: string;
        status: number;
        job_description: string;
        compliance_verified: boolean;
        pause_time: string;
        total_pause_duration: string;
        last_withdrawal_time: string;
      }>;
    }>({
      accountAddress: CONTRACT_ADDRESS,
      resourceType: `${MODULES.WAGE_STREAMING}::StreamStore`,
    });
    
    // Filter streams where the employee matches and stream is active/paused
    const employeeStreams = streamStoreResource.streams.filter(
      s => s.employee.toLowerCase() === employeeAddress.toLowerCase() && 
           (s.status === 1 || s.status === 2) // Active or Paused
    );
    
    return employeeStreams.map(s => s.stream_id);
  } catch (error) {
    // If StreamStore doesn't exist, try the old method as fallback
    try {
      const resource = await aptos.getAccountResource<{
        active_stream_ids: string[];
        total_earnings: string;
        total_withdrawals: string;
        last_activity: string;
      }>({
        accountAddress: employeeAddress,
        resourceType: `${MODULES.WAGE_STREAMING}::EmployeeStreams`,
      });
      
      return resource.active_stream_ids || [];
    } catch {
      // Resource doesn't exist - this is expected for new employees
      const parsedError = parseAptosError(error);
      if (parsedError.isExpected || !parsedError.shouldLog) {
        return [];
      }
      console.error("Error fetching employee streams:", parsedError.message);
      return [];
    }
  }
};

/**
 * Check if a stream exists
 * NOTE: This view function is not currently available in the deployed contract.
 */
export const streamExists = async (streamId: string): Promise<boolean> => {
  // Try to get stream info instead - if it returns data, stream exists
  try {
    const result = await getStreamInfo(CONTRACT_ADDRESS, Number(streamId));
    return result !== null;
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
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
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
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
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
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
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
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
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
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
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
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
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
    options: {
      maxGasAmount: DEFAULT_MAX_GAS,
    },
  };
};
