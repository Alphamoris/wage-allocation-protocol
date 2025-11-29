"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { CONTRACT_ADDRESS } from "@/lib/aptos/config";
import {
  CampaignInfo,
  EmployeeRewardsSummary,
  ParticipationInfo,
  StreakInfo,
  PhotonRegistryStats,
  getPhotonRegistryStats,
  getCampaignInfo,
  getEmployeeRewardsSummary,
  getParticipationInfo,
  getStreakInfo,
  isPhotonEnabled,
} from "@/lib/aptos/photonRewards";

// Hook for Photon registry stats
export const usePhotonRegistryStats = (registryAddress?: string) => {
  const [stats, setStats] = useState<PhotonRegistryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPhotonRegistryStats(registryAddr);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch registry stats");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook for campaign information
export const useCampaignInfo = (campaignAddress: string) => {
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!campaignAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getCampaignInfo(campaignAddress);
      setCampaign(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch campaign info");
    } finally {
      setLoading(false);
    }
  }, [campaignAddress]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return { campaign, loading, error, refetch: fetchCampaign };
};

// Hook for employee rewards summary
export const useEmployeeRewardsSummary = (employeeAddress?: string) => {
  const { address } = useAuth();
  const [summary, setSummary] = useState<EmployeeRewardsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetAddress = employeeAddress || address;

  const fetchSummary = useCallback(async () => {
    if (!targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getEmployeeRewardsSummary(targetAddress);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rewards summary");
    } finally {
      setLoading(false);
    }
  }, [targetAddress]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Refresh every 30 seconds
  useEffect(() => {
    if (!targetAddress) return;
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, [targetAddress, fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
};

// Hook for participation info
export const useParticipationInfo = (participantAddress?: string) => {
  const { address } = useAuth();
  const [participation, setParticipation] = useState<ParticipationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetAddress = participantAddress || address;

  const fetchParticipation = useCallback(async () => {
    if (!targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getParticipationInfo(targetAddress);
      setParticipation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch participation info");
    } finally {
      setLoading(false);
    }
  }, [targetAddress]);

  useEffect(() => {
    fetchParticipation();
  }, [fetchParticipation]);

  return { participation, loading, error, refetch: fetchParticipation };
};

// Hook for streak information
export const useStreakInfo = (employeeAddress?: string) => {
  const { address } = useAuth();
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetAddress = employeeAddress || address;

  const fetchStreak = useCallback(async () => {
    if (!targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getStreakInfo(targetAddress);
      setStreak(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch streak info");
    } finally {
      setLoading(false);
    }
  }, [targetAddress]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return { streak, loading, error, refetch: fetchStreak };
};

// Hook for checking if Photon is enabled
export const usePhotonEnabled = (registryAddress?: string) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const checkEnabled = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await isPhotonEnabled(registryAddr);
      setIsEnabled(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check Photon status");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    checkEnabled();
  }, [checkEnabled]);

  return { isEnabled, loading, error, refetch: checkEnabled };
};

// Combined hook for employee rewards dashboard
export const useEmployeeRewardsDashboard = (employeeAddress?: string) => {
  const { summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = 
    useEmployeeRewardsSummary(employeeAddress);
  const { streak, loading: streakLoading, error: streakError, refetch: refetchStreak } = 
    useStreakInfo(employeeAddress);
  const { participation, loading: participationLoading, error: participationError, refetch: refetchParticipation } = 
    useParticipationInfo(employeeAddress);

  const loading = summaryLoading || streakLoading || participationLoading;
  const error = summaryError || streakError || participationError;

  const refetch = useCallback(async () => {
    await Promise.all([refetchSummary(), refetchStreak(), refetchParticipation()]);
  }, [refetchSummary, refetchStreak, refetchParticipation]);

  return {
    summary,
    streak,
    participation,
    loading,
    error,
    refetch,
  };
};

// Hook for Photon balance (alias for rewards summary)
export const usePhotonBalance = (employeeAddress?: string) => {
  const { summary, loading, error, refetch } = useEmployeeRewardsSummary(employeeAddress);

  return {
    balance: summary?.pendingPat || BigInt(0),
    totalEarned: summary?.totalPatEarned || BigInt(0),
    totalClaimed: summary?.totalPatClaimed || BigInt(0),
    loading,
    error,
    refetch,
  };
};

// Hook for Photon operations (claim rewards)
export const usePhotonOperations = () => {
  const { signAndSubmitTransaction } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimRewards = useCallback(async (): Promise<string | null> => {
    if (!signAndSubmitTransaction) {
      setError("Wallet not connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Claim rewards transaction
      const payload = {
        data: {
          function: `${CONTRACT_ADDRESS}::photon_rewards::claim_rewards` as `${string}::${string}::${string}`,
          functionArguments: [],
        },
      };

      const response = await signAndSubmitTransaction(payload);
      return response.hash;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to claim rewards";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [signAndSubmitTransaction]);

  return { claimRewards, loading, error };
};
