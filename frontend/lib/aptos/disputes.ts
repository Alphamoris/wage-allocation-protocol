import { aptos, MODULES, CONTRACT_ADDRESS } from "./config";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Types
export interface DisputeInfo {
  disputeId: bigint;
  employer: string;
  employee: string;
  category: number;
  status: number;
  disputedAmount: bigint;
  escrowAmount: bigint;
  resolvedAt: number;
  arbitrator: string;
}

export interface ResolutionInfo {
  outcome: number;
  awardedToEmployee: bigint;
  returnedToEmployer: bigint;
  arbitrator: string;
  resolvedAt: number;
}

export interface DisputeStats {
  totalDisputes: bigint;
  openDisputes: bigint;
  totalDisputedAmount: bigint;
  totalResolvedAmount: bigint;
}

// Dispute Status Constants
export const DISPUTE_STATUS = {
  OPENED: 0,
  EVIDENCE_SUBMISSION: 1,
  MEDIATION: 2,
  ARBITRATION: 3,
  RESOLVED: 4,
  APPEALED: 5,
  FINAL: 6,
  CANCELLED: 7,
} as const;

// Dispute Category Constants
export const DISPUTE_CATEGORY = {
  WAGE_AMOUNT: 0,
  PAYMENT_TIMING: 1,
  DEDUCTIONS: 2,
  OVERTIME: 3,
  BONUS: 4,
  TERMINATION: 5,
  OTHER: 6,
} as const;

// Resolution Outcome Constants
export const RESOLUTION_OUTCOME = {
  EMPLOYER_FAVOR: 0,
  EMPLOYEE_FAVOR: 1,
  SPLIT_DECISION: 2,
  DISMISSED: 3,
} as const;

// Evidence Type Constants
export const EVIDENCE_TYPE = {
  DOCUMENT: 0,
  TRANSACTION_HASH: 1,
  WITNESS_STATEMENT: 2,
  AUDIT_TRAIL: 3,
} as const;

// ============ VIEW FUNCTIONS ============

/**
 * Check if a dispute exists
 */
export const disputeExists = async (
  registryAddr: string,
  disputeId: number
): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.DISPUTES}::dispute_exists`,
        functionArguments: [registryAddr, disputeId],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking dispute existence:", error);
    return false;
  }
};

/**
 * Get active arbitrators count
 */
export const getActiveArbitratorsCount = async (
  registryAddr: string
): Promise<bigint> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.DISPUTES}::get_active_arbitrators_count`,
        functionArguments: [registryAddr],
      },
    });
    return BigInt(result[0] as string);
  } catch (error) {
    console.error("Error fetching active arbitrators count:", error);
    return BigInt(0);
  }
};

/**
 * Get dispute details
 */
export const getDispute = async (
  registryAddr: string,
  disputeId: number
): Promise<DisputeInfo | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.DISPUTES}::get_dispute`,
        functionArguments: [registryAddr, disputeId],
      },
    });

    const [
      id,
      employer,
      employee,
      category,
      status,
      disputedAmount,
      escrowAmount,
      resolvedAt,
      arbitrator,
    ] = result as [
      string,
      string,
      string,
      number,
      number,
      string,
      string,
      string,
      string
    ];

    return {
      disputeId: BigInt(id),
      employer,
      employee,
      category,
      status,
      disputedAmount: BigInt(disputedAmount),
      escrowAmount: BigInt(escrowAmount),
      resolvedAt: Number(resolvedAt),
      arbitrator,
    };
  } catch (error) {
    console.error("Error fetching dispute:", error);
    return null;
  }
};

/**
 * Get dispute statistics
 */
export const getDisputeStats = async (
  registryAddr: string
): Promise<DisputeStats | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.DISPUTES}::get_dispute_stats`,
        functionArguments: [registryAddr],
      },
    });

    const [totalDisputes, openDisputes, totalDisputedAmount, totalResolvedAmount] =
      result as [string, string, string, string];

    return {
      totalDisputes: BigInt(totalDisputes),
      openDisputes: BigInt(openDisputes),
      totalDisputedAmount: BigInt(totalDisputedAmount),
      totalResolvedAmount: BigInt(totalResolvedAmount),
    };
  } catch (error) {
    console.error("Error fetching dispute stats:", error);
    return null;
  }
};

/**
 * Get evidence count for a dispute
 */
export const getEvidenceCount = async (
  registryAddr: string,
  disputeId: number
): Promise<bigint> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.DISPUTES}::get_evidence_count`,
        functionArguments: [registryAddr, disputeId],
      },
    });
    return BigInt(result[0] as string);
  } catch (error) {
    console.error("Error fetching evidence count:", error);
    return BigInt(0);
  }
};

/**
 * Get dispute resolution details
 */
export const getResolution = async (
  registryAddr: string,
  disputeId: number
): Promise<ResolutionInfo | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.DISPUTES}::get_resolution`,
        functionArguments: [registryAddr, disputeId],
      },
    });

    const [outcome, awardedToEmployee, returnedToEmployer, arbitrator, resolvedAt] =
      result as [number, string, string, string, string];

    return {
      outcome,
      awardedToEmployee: BigInt(awardedToEmployee),
      returnedToEmployer: BigInt(returnedToEmployer),
      arbitrator,
      resolvedAt: Number(resolvedAt),
    };
  } catch (error) {
    console.error("Error fetching resolution:", error);
    return null;
  }
};

// ============ TRANSACTION PAYLOADS ============

/**
 * Open a new dispute
 */
export const openDisputePayload = (
  registryAddr: string,
  streamId: number,
  respondent: string,
  employer: string,
  employee: string,
  category: number,
  disputedAmount: bigint,
  title: string,
  description: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.DISPUTES}::open_dispute`,
      functionArguments: [
        registryAddr,
        streamId,
        respondent,
        employer,
        employee,
        category,
        disputedAmount.toString(),
        title,
        description,
      ],
    },
  };
};

/**
 * Submit evidence for a dispute
 */
export const submitEvidencePayload = (
  registryAddr: string,
  disputeId: number,
  evidenceType: number,
  contentHash: string,
  description: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.DISPUTES}::submit_evidence`,
      functionArguments: [
        registryAddr,
        disputeId,
        evidenceType,
        contentHash,
        description,
      ],
    },
  };
};

/**
 * Escalate dispute to arbitration
 */
export const escalateToArbitrationPayload = (
  registryAddr: string,
  disputeId: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.DISPUTES}::escalate_to_arbitration`,
      functionArguments: [registryAddr, disputeId],
    },
  };
};

/**
 * Cancel a dispute
 */
export const cancelDisputePayload = (
  registryAddr: string,
  disputeId: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.DISPUTES}::cancel_dispute`,
      functionArguments: [registryAddr, disputeId],
    },
  };
};

/**
 * Resolve a dispute (arbitrator only)
 */
export const resolveDisputePayload = (
  registryAddr: string,
  disputeId: number,
  outcome: number,
  awardToEmployee: bigint,
  returnToEmployer: bigint,
  resolutionHash: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.DISPUTES}::resolve_dispute`,
      functionArguments: [
        registryAddr,
        disputeId,
        outcome,
        awardToEmployee.toString(),
        returnToEmployer.toString(),
        resolutionHash,
      ],
    },
  };
};

/**
 * File an appeal
 */
export const fileAppealPayload = (
  registryAddr: string,
  disputeId: number,
  reason: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.DISPUTES}::file_appeal`,
      functionArguments: [registryAddr, disputeId, reason],
    },
  };
};
