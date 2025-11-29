import { aptos, MODULES, CONTRACT_ADDRESS } from "./config";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Types
export interface CampaignInfo {
  campaignId: bigint;
  employer: string;
  name: string;
  status: number;
  totalBudget: bigint;
  distributedAmount: bigint;
  totalParticipants: bigint;
}

export interface EmployeeRewardsSummary {
  totalPatEarned: bigint;
  totalPatClaimed: bigint;
  pendingPat: bigint;
  currentStreak: bigint;
  campaignsParticipated: bigint;
  engagementScore: bigint;
}

export interface ParticipationInfo {
  campaignId: bigint;
  currentProgress: bigint;
  currentTier: bigint;
  rewardsEarned: bigint;
  rewardsClaimed: bigint;
}

export interface StreakInfo {
  currentStreak: bigint;
  longestStreak: bigint;
  streakRewardsEarned: bigint;
}

export interface PhotonRegistryStats {
  totalCampaigns: bigint;
  totalPatDistributed: bigint;
  totalUniqueParticipants: bigint;
  activeCampaigns: bigint;
}

// Campaign Status Constants
export const CAMPAIGN_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PAUSED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

// Reward Type Constants
export const REWARD_TYPE = {
  FIXED: 0,
  PERCENTAGE: 1,
  TIERED: 2,
  MILESTONE: 3,
} as const;

// Trigger Type Constants
export const TRIGGER_TYPE = {
  ATTENDANCE: 0,
  PERFORMANCE: 1,
  REFERRAL: 2,
  MILESTONE: 3,
  STREAK: 4,
  CUSTOM: 5,
} as const;

// ============ VIEW FUNCTIONS ============

/**
 * Get registry statistics for photon rewards
 */
export const getRegistryStats = async (
  registryAddr: string
): Promise<PhotonRegistryStats | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.PHOTON_REWARDS}::get_registry_stats`,
        functionArguments: [registryAddr],
      },
    });

    const [totalCampaigns, totalPatDistributed, totalUniqueParticipants, activeCampaigns] =
      result as [string, string, string, string];

    return {
      totalCampaigns: BigInt(totalCampaigns),
      totalPatDistributed: BigInt(totalPatDistributed),
      totalUniqueParticipants: BigInt(totalUniqueParticipants),
      activeCampaigns: BigInt(activeCampaigns),
    };
  } catch (error) {
    console.error("Error fetching registry stats:", error);
    return null;
  }
};

/**
 * Get campaign information
 */
export const getCampaignInfo = async (
  campaignAddr: string
): Promise<CampaignInfo | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.PHOTON_REWARDS}::get_campaign_info`,
        functionArguments: [campaignAddr],
      },
    });

    const [campaignId, employer, name, status, totalBudget, distributedAmount, totalParticipants] =
      result as [string, string, string, number, string, string, string];

    return {
      campaignId: BigInt(campaignId),
      employer,
      name,
      status,
      totalBudget: BigInt(totalBudget),
      distributedAmount: BigInt(distributedAmount),
      totalParticipants: BigInt(totalParticipants),
    };
  } catch (error) {
    console.error("Error fetching campaign info:", error);
    return null;
  }
};

/**
 * Get employee rewards summary
 */
export const getEmployeeRewardsSummary = async (
  employeeAddr: string
): Promise<EmployeeRewardsSummary | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.PHOTON_REWARDS}::get_employee_rewards_summary`,
        functionArguments: [employeeAddr],
      },
    });

    const [
      totalPatEarned,
      totalPatClaimed,
      pendingPat,
      currentStreak,
      campaignsParticipated,
      engagementScore,
    ] = result as [string, string, string, string, string, string];

    return {
      totalPatEarned: BigInt(totalPatEarned),
      totalPatClaimed: BigInt(totalPatClaimed),
      pendingPat: BigInt(pendingPat),
      currentStreak: BigInt(currentStreak),
      campaignsParticipated: BigInt(campaignsParticipated),
      engagementScore: BigInt(engagementScore),
    };
  } catch (error) {
    console.error("Error fetching employee rewards summary:", error);
    return null;
  }
};

/**
 * Get participation information
 */
export const getParticipationInfo = async (
  participantAddr: string
): Promise<ParticipationInfo | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.PHOTON_REWARDS}::get_participation_info`,
        functionArguments: [participantAddr],
      },
    });

    const [campaignId, currentProgress, currentTier, rewardsEarned, rewardsClaimed] =
      result as [string, string, string, string, string];

    return {
      campaignId: BigInt(campaignId),
      currentProgress: BigInt(currentProgress),
      currentTier: BigInt(currentTier),
      rewardsEarned: BigInt(rewardsEarned),
      rewardsClaimed: BigInt(rewardsClaimed),
    };
  } catch (error) {
    console.error("Error fetching participation info:", error);
    return null;
  }
};

/**
 * Get streak information for an employee
 */
export const getStreakInfo = async (
  employeeAddr: string
): Promise<StreakInfo | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.PHOTON_REWARDS}::get_streak_info`,
        functionArguments: [employeeAddr],
      },
    });

    const [currentStreak, longestStreak, streakRewardsEarned] = result as [
      string,
      string,
      string
    ];

    return {
      currentStreak: BigInt(currentStreak),
      longestStreak: BigInt(longestStreak),
      streakRewardsEarned: BigInt(streakRewardsEarned),
    };
  } catch (error) {
    console.error("Error fetching streak info:", error);
    return null;
  }
};

/**
 * Check if Photon integration is enabled
 */
export const isPhotonEnabled = async (registryAddr: string): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.PHOTON_REWARDS}::is_photon_enabled`,
        functionArguments: [registryAddr],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking Photon enabled status:", error);
    return false;
  }
};

// ============ TRANSACTION PAYLOADS ============

/**
 * Initialize employee rewards tracking
 */
export const initializeEmployeeRewardsPayload = (): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.PHOTON_REWARDS}::initialize_employee_rewards`,
      functionArguments: [],
    },
  };
};

/**
 * Initialize employer campaign registry
 */
export const initializeEmployerCampaignRegistryPayload = (): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.PHOTON_REWARDS}::initialize_employer_campaign_registry`,
      functionArguments: [],
    },
  };
};

/**
 * Create a new campaign
 */
export const createCampaignPayload = (
  registryAddr: string,
  name: string,
  description: string,
  rewardType: number,
  triggerType: number,
  startTime: number,
  endTime: number,
  totalBudget: bigint,
  perParticipantCap: bigint,
  minEligibilityScore: number,
  rewardTokenMetadata: string,
  photonExternalId: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.PHOTON_REWARDS}::create_campaign`,
      functionArguments: [
        registryAddr,
        name,
        description,
        rewardType,
        triggerType,
        startTime,
        endTime,
        totalBudget.toString(),
        perParticipantCap.toString(),
        minEligibilityScore,
        rewardTokenMetadata,
        photonExternalId,
      ],
    },
  };
};

/**
 * Register for a campaign
 */
export const registerForCampaignPayload = (
  campaignAddr: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.PHOTON_REWARDS}::register_for_campaign`,
      functionArguments: [campaignAddr],
    },
  };
};

/**
 * Claim campaign rewards
 */
export const claimCampaignRewardsPayload = (
  campaignAddr: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.PHOTON_REWARDS}::claim_campaign_rewards`,
      functionArguments: [campaignAddr],
    },
  };
};

/**
 * Record daily check-in for streak
 */
export const recordDailyCheckinPayload = (): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.PHOTON_REWARDS}::record_daily_checkin`,
      functionArguments: [],
    },
  };
};

/**
 * Claim streak rewards
 */
export const claimStreakRewardsPayload = (
  registryAddr: string
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.PHOTON_REWARDS}::claim_streak_rewards`,
      functionArguments: [registryAddr],
    },
  };
};

/**
 * Update campaign status
 */
export const updateCampaignStatusPayload = (
  campaignAddr: string,
  newStatus: number
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.PHOTON_REWARDS}::update_campaign_status`,
      functionArguments: [campaignAddr, newStatus],
    },
  };
};
