import { aptos, MODULES, CONTRACT_ADDRESS } from "./config";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Types
export interface SystemState {
  currentState: number;
  stateChangedAt: number;
  stateChangedBy: string;
  pauseExpiresAt: number;
}

// System State Constants
export const SYSTEM_STATE = {
  NORMAL: 0,
  PAUSED: 1,
  EMERGENCY: 2,
  MAINTENANCE: 3,
  DEPRECATED: 4,
} as const;

// Role Constants
export const ROLE = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  OPERATOR: 2,
  PAUSER: 3,
  UPGRADER: 4,
} as const;

// Module Index Constants
export const MODULE_INDEX = {
  WAGE_STREAMING: 0,
  TREASURY: 1,
  COMPLIANCE: 2,
  DISPUTES: 3,
} as const;

// ============ VIEW FUNCTIONS ============

/**
 * Get admin count
 */
export const getAdminCount = async (registryAddr: string): Promise<bigint> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMERGENCY}::get_admin_count`,
        functionArguments: [registryAddr],
      },
    });
    return BigInt(result[0] as string);
  } catch (error) {
    console.error("Error fetching admin count:", error);
    return BigInt(0);
  }
};

/**
 * Get current system state
 */
export const getSystemState = async (
  registryAddr: string
): Promise<SystemState | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMERGENCY}::get_system_state`,
        functionArguments: [registryAddr],
      },
    });

    const [currentState, stateChangedAt, stateChangedBy, pauseExpiresAt] =
      result as [number, string, string, string];

    return {
      currentState,
      stateChangedAt: Number(stateChangedAt),
      stateChangedBy,
      pauseExpiresAt: Number(pauseExpiresAt),
    };
  } catch (error) {
    console.error("Error fetching system state:", error);
    return null;
  }
};

/**
 * Check if an address has a specific role
 */
export const hasRole = async (
  registryAddr: string,
  holder: string,
  role: number
): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMERGENCY}::has_role`,
        functionArguments: [registryAddr, holder, role],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
};

/**
 * Check if a specific module is paused
 */
export const isModulePaused = async (
  registryAddr: string,
  moduleIndex: number
): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMERGENCY}::is_module_paused`,
        functionArguments: [registryAddr, moduleIndex],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking module pause status:", error);
    return false;
  }
};

/**
 * Check if the entire system is paused
 */
export const isSystemPaused = async (registryAddr: string): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMERGENCY}::is_system_paused`,
        functionArguments: [registryAddr],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking system pause status:", error);
    return false;
  }
};

/**
 * Check if an upgrade is pending
 */
export const isUpgradePending = async (registryAddr: string): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.EMERGENCY}::is_upgrade_pending`,
        functionArguments: [registryAddr],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking upgrade pending status:", error);
    return false;
  }
};

// ============ TRANSACTION PAYLOADS ============

/**
 * Pause the entire system
 */
export const pauseSystemPayload = (
  registryAddr: string,
  reason: string,
  durationSeconds: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::pause_system`,
      functionArguments: [registryAddr, reason, durationSeconds],
    },
  };
};

/**
 * Unpause the system
 */
export const unpauseSystemPayload = (
  registryAddr: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::unpause_system`,
      functionArguments: [registryAddr],
    },
  };
};

/**
 * Trigger emergency pause
 */
export const triggerEmergencyPayload = (
  registryAddr: string,
  reason: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::trigger_emergency`,
      functionArguments: [registryAddr, reason],
    },
  };
};

/**
 * Pause a specific module
 */
export const pauseModulePayload = (
  registryAddr: string,
  moduleIndex: number,
  reason: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::pause_module`,
      functionArguments: [registryAddr, moduleIndex, reason],
    },
  };
};

/**
 * Unpause a specific module
 */
export const unpauseModulePayload = (
  registryAddr: string,
  moduleIndex: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::unpause_module`,
      functionArguments: [registryAddr, moduleIndex],
    },
  };
};

/**
 * Grant a role to an address
 */
export const grantRolePayload = (
  registryAddr: string,
  holder: string,
  role: number,
  expiresAt: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::grant_role`,
      functionArguments: [registryAddr, holder, role, expiresAt],
    },
  };
};

/**
 * Revoke a role from an address
 */
export const revokeRolePayload = (
  registryAddr: string,
  holder: string,
  role: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::revoke_role`,
      functionArguments: [registryAddr, holder, role],
    },
  };
};

/**
 * Propose an upgrade
 */
export const proposeUpgradePayload = (
  registryAddr: string,
  newVersionHash: string,
  description: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::propose_upgrade`,
      functionArguments: [registryAddr, newVersionHash, description],
    },
  };
};

/**
 * Cancel a pending upgrade
 */
export const cancelUpgradePayload = (
  registryAddr: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.EMERGENCY}::cancel_upgrade`,
      functionArguments: [registryAddr],
    },
  };
};
