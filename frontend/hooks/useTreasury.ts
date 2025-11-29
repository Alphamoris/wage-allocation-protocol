"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { aptos, octasToApt, CONTRACT_ADDRESS } from "@/lib/aptos/config";
import {
  TreasuryInfo,
  TreasuryStats,
  TreasuryBalance,
  TreasuryStatus,
  TreasuryAnalytics,
  TreasuryAllocation,
  TreasuryRegistryStats,
  treasuryExists,
  getTreasuryInfo,
  getTreasuryBalance,
  getTreasuryStatus,
  getTreasuryHealth,
  getTreasuryAnalytics,
  getAllocation,
  getTreasuryRegistryStats,
  getAllocatedBalance,
  getAvailableBalance,
  isTreasuryInitialized,
  getTreasuryStats,
  initializeTreasuryPayload,
  depositPayload,
  withdrawPayload,
  allocateForStreamPayload,
  deallocateFromStreamPayload,
  emergencyWithdrawPayload,
  setAutoTopupThresholdPayload,
} from "@/lib/aptos/employerTreasury";

// Default registry address (contract address)
const DEFAULT_REGISTRY = CONTRACT_ADDRESS;

// Hook for fetching treasury information
export const useTreasuryInfo = () => {
  const { address } = useAuth();
  const [treasuryInfo, setTreasuryInfo] = useState<TreasuryInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasuryInfo = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const info = await getTreasuryInfo(address);
      setTreasuryInfo(info);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch treasury info"
      );
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTreasuryInfo();
  }, [fetchTreasuryInfo]);

  return { treasuryInfo, loading, error, refetch: fetchTreasuryInfo };
};

// Hook for checking if treasury exists
export const useTreasuryExists = (employerAddr?: string) => {
  const { address } = useAuth();
  const targetAddr = employerAddr || address;
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkExists = useCallback(async () => {
    if (!targetAddr) return;

    setLoading(true);
    try {
      const result = await treasuryExists(targetAddr);
      setExists(result);
    } catch {
      setExists(false);
    } finally {
      setLoading(false);
    }
  }, [targetAddr]);

  useEffect(() => {
    checkExists();
  }, [checkExists]);

  return { exists, loading, refetch: checkExists };
};

// Hook for treasury balance with real-time updates
export const useTreasuryBalance = () => {
  const { address } = useAuth();
  const [balanceData, setBalanceData] = useState<TreasuryBalance | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const balance = await getTreasuryBalance(address);
      setBalanceData(balance);
    } catch {
      // Silently fail for balance updates
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Refresh every 10 seconds
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [address, fetchBalances]);

  return {
    balance: balanceData?.totalBalance || BigInt(0),
    balanceInApt: octasToApt(balanceData?.totalBalance || BigInt(0)),
    allocatedBalance: balanceData?.allocatedBalance || BigInt(0),
    allocatedBalanceInApt: octasToApt(balanceData?.allocatedBalance || BigInt(0)),
    availableBalance: balanceData?.availableBalance || BigInt(0),
    availableBalanceInApt: octasToApt(balanceData?.availableBalance || BigInt(0)),
    reserveBalance: balanceData?.reserveBalance || BigInt(0),
    reserveBalanceInApt: octasToApt(balanceData?.reserveBalance || BigInt(0)),
    loading,
    refetch: fetchBalances,
  };
};

// Hook for treasury status
export const useTreasuryStatus = (employerAddr?: string) => {
  const { address } = useAuth();
  const targetAddr = employerAddr || address;
  const [status, setStatus] = useState<TreasuryStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!targetAddr) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getTreasuryStatus(targetAddr);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch treasury status");
    } finally {
      setLoading(false);
    }
  }, [targetAddr]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};

// Hook for treasury health
export const useTreasuryHealth = (employerAddr?: string) => {
  const { address } = useAuth();
  const targetAddr = employerAddr || address;
  const [health, setHealth] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    if (!targetAddr) return;

    setLoading(true);
    try {
      const result = await getTreasuryHealth(targetAddr);
      setHealth(result);
    } catch {
      setHealth(BigInt(0));
    } finally {
      setLoading(false);
    }
  }, [targetAddr]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { 
    health, 
    healthPercentage: Number(health) / 100, // Convert basis points to percentage
    loading, 
    refetch: fetchHealth 
  };
};

// Hook for treasury analytics
export const useTreasuryAnalytics = (employerAddr?: string) => {
  const { address } = useAuth();
  const targetAddr = employerAddr || address;
  const [analytics, setAnalytics] = useState<TreasuryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!targetAddr) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getTreasuryAnalytics(targetAddr);
      setAnalytics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch treasury analytics");
    } finally {
      setLoading(false);
    }
  }, [targetAddr]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
};

// Hook for stream allocation
export const useStreamAllocation = (employerAddr: string | undefined, streamId: number | null) => {
  const [allocation, setAllocation] = useState<TreasuryAllocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocation = useCallback(async () => {
    if (!employerAddr || streamId === null) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getAllocation(employerAddr, streamId);
      setAllocation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch allocation");
    } finally {
      setLoading(false);
    }
  }, [employerAddr, streamId]);

  useEffect(() => {
    fetchAllocation();
  }, [fetchAllocation]);

  return { allocation, loading, error, refetch: fetchAllocation };
};

// Hook for treasury registry stats
export const useTreasuryRegistryStats = (registryAddr: string = DEFAULT_REGISTRY) => {
  const [stats, setStats] = useState<TreasuryRegistryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getTreasuryRegistryStats(registryAddr);
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

// Hook for checking treasury initialization
export const useTreasuryInitialized = () => {
  const { address } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkInitialization = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const initialized = await isTreasuryInitialized(address);
      setIsInitialized(initialized);
    } catch {
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    checkInitialization();
  }, [checkInitialization]);

  return { isInitialized, loading, refetch: checkInitialization };
};

// Hook for treasury stats
export const useTreasuryStats = () => {
  const { address } = useAuth();
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getTreasuryStats(address);
      setStats(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch treasury stats"
      );
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};


// Hook for treasury operations
export const useTreasuryOperations = (registryAddr: string = DEFAULT_REGISTRY) => {
  const { signAndSubmitTransaction, address } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeTreasury = useCallback(
    async (initialDeposit: bigint) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = initializeTreasuryPayload(registryAddr, initialDeposit);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize treasury"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const deposit = useCallback(
    async (amount: bigint) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = depositPayload(registryAddr, amount);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to deposit");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const withdraw = useCallback(
    async (amount: bigint) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = withdrawPayload(registryAddr, amount);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to withdraw");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const allocateForStream = useCallback(
    async (streamId: number, amount: bigint) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = allocateForStreamPayload(registryAddr, streamId, amount);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to allocate for stream"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const deallocateFromStream = useCallback(
    async (streamId: number, unusedAmount: bigint) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = deallocateFromStreamPayload(registryAddr, streamId, unusedAmount);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to deallocate from stream"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const emergencyWithdraw = useCallback(async () => {
    if (!address) {
      setError("Wallet not connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = emergencyWithdrawPayload(registryAddr);
      const response = await signAndSubmitTransaction(payload);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      return response.hash;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to emergency withdraw"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [signAndSubmitTransaction, address, registryAddr]);

  const setAutoTopupThreshold = useCallback(
    async (threshold: bigint) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = setAutoTopupThresholdPayload(threshold);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to set auto top-up threshold"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address]
  );

  return {
    initializeTreasury,
    deposit,
    withdraw,
    allocateForStream,
    deallocateFromStream,
    emergencyWithdraw,
    setAutoTopupThreshold,
    loading,
    error,
  };
};
