"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { aptos, octasToApt, CONTRACT_ADDRESS } from "@/lib/aptos/config";
import {
  StreamInfo,
  StreamDetails,
  RegistryStats,
  getStreamInfo,
  getStreamDetails,
  getWithdrawableBalance,
  getRegistryStats,
  hasActiveStreams,
  getEmployerStreams,
  getEmployeeStreams,
  createStreamPayload,
  pauseStreamPayload,
  resumeStreamPayload,
  terminateStreamPayload,
  withdrawWagesPayload,
  withdrawAllPayload,
  setDisputeStatusPayload,
} from "@/lib/aptos/wageStreaming";

// Default registry address (contract address)
const DEFAULT_REGISTRY = CONTRACT_ADDRESS;

// Hook for fetching stream information
export const useStreamInfo = (streamId: number | null, registryAddr: string = DEFAULT_REGISTRY) => {
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreamInfo = useCallback(async () => {
    if (streamId === null) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const info = await getStreamInfo(registryAddr, streamId);
      setStreamInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stream info");
    } finally {
      setLoading(false);
    }
  }, [streamId, registryAddr]);

  useEffect(() => {
    fetchStreamInfo();
  }, [fetchStreamInfo]);

  return { streamInfo, loading, error, refetch: fetchStreamInfo };
};

// Hook for fetching detailed stream information including real-time balance
export const useStreamDetails = (streamId: number | null, registryAddr: string = DEFAULT_REGISTRY) => {
  const [details, setDetails] = useState<StreamDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (streamId === null) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getStreamDetails(registryAddr, streamId);
      setDetails(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stream details");
    } finally {
      setLoading(false);
    }
  }, [streamId, registryAddr]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Auto-refresh every 5 seconds for real-time balance
  useEffect(() => {
    if (streamId === null) return;
    
    const interval = setInterval(fetchDetails, 5000);
    return () => clearInterval(interval);
  }, [streamId, fetchDetails]);

  return { details, loading, error, refetch: fetchDetails };
};

// Hook for fetching withdrawable balance with real-time updates
export const useWithdrawableBalance = (streamId: number | null, registryAddr: string = DEFAULT_REGISTRY) => {
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (streamId === null) return;
    
    setLoading(true);
    try {
      const result = await getWithdrawableBalance(registryAddr, streamId);
      setBalance(result);
    } catch {
      // Silently fail for balance updates
    } finally {
      setLoading(false);
    }
  }, [streamId, registryAddr]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Real-time updates every second
  useEffect(() => {
    if (streamId === null) return;
    
    const interval = setInterval(fetchBalance, 1000);
    return () => clearInterval(interval);
  }, [streamId, fetchBalance]);

  return {
    balance,
    balanceInApt: octasToApt(balance),
    loading,
    refetch: fetchBalance,
  };
};

// Hook for registry statistics
export const useRegistryStats = (registryAddr: string = DEFAULT_REGISTRY) => {
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getRegistryStats(registryAddr);
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

// Hook for checking if employee has active streams
export const useHasActiveStreams = (employeeAddr?: string) => {
  const { address } = useAuth();
  const targetAddr = employeeAddr || address;
  const [hasStreams, setHasStreams] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkActiveStreams = useCallback(async () => {
    if (!targetAddr) return;

    setLoading(true);
    setError(null);

    try {
      const result = await hasActiveStreams(targetAddr);
      setHasStreams(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check active streams");
    } finally {
      setLoading(false);
    }
  }, [targetAddr]);

  useEffect(() => {
    checkActiveStreams();
  }, [checkActiveStreams]);

  return { hasStreams, loading, error, refetch: checkActiveStreams };
};

// Hook for employer streams
export const useEmployerStreams = (registryAddr: string = DEFAULT_REGISTRY) => {
  const { address } = useAuth();
  const [streamIds, setStreamIds] = useState<string[]>([]);
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const ids = await getEmployerStreams(address);
      setStreamIds(ids);
      
      // Fetch details for each stream
      const streamDetails = await Promise.all(
        ids.map(id => getStreamInfo(registryAddr, Number(id)))
      );
      setStreams(streamDetails.filter((s): s is StreamInfo => s !== null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch streams");
    } finally {
      setLoading(false);
    }
  }, [address, registryAddr]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { streamIds, streams, loading, error, refetch: fetchStreams };
};

// Hook for employee streams
export const useEmployeeStreams = (registryAddr: string = DEFAULT_REGISTRY) => {
  const { address } = useAuth();
  const [streamIds, setStreamIds] = useState<string[]>([]);
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const ids = await getEmployeeStreams(address);
      setStreamIds(ids);
      
      // Fetch details for each stream
      const streamDetails = await Promise.all(
        ids.map(id => getStreamInfo(registryAddr, Number(id)))
      );
      setStreams(streamDetails.filter((s): s is StreamInfo => s !== null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch streams");
    } finally {
      setLoading(false);
    }
  }, [address, registryAddr]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { streamIds, streams, loading, error, refetch: fetchStreams };
};

// Hook for wage streaming operations (employer)
export const useWageStreamingEmployer = (registryAddr: string = DEFAULT_REGISTRY) => {
  const { signAndSubmitTransaction, address } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStream = useCallback(
    async (
      employeeAddress: string,
      totalAmount: bigint,
      durationSeconds: number,
      jobDescription: string = ""
    ) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = createStreamPayload(
          registryAddr,
          employeeAddress,
          totalAmount,
          durationSeconds,
          jobDescription
        );
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create stream");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const pauseStream = useCallback(
    async (streamId: number) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = pauseStreamPayload(registryAddr, streamId);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to pause stream");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const resumeStream = useCallback(
    async (streamId: number) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = resumeStreamPayload(registryAddr, streamId);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resume stream");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const terminateStream = useCallback(
    async (streamId: number) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = terminateStreamPayload(registryAddr, streamId);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to terminate stream");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const setDisputeStatus = useCallback(
    async (streamId: number, disputeStatus: boolean) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = setDisputeStatusPayload(registryAddr, streamId, disputeStatus);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set dispute status");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  return {
    createStream,
    pauseStream,
    resumeStream,
    terminateStream,
    setDisputeStatus,
    loading,
    error,
  };
};

// Hook for wage streaming operations (employee)
export const useWageStreamingEmployee = (registryAddr: string = DEFAULT_REGISTRY) => {
  const { signAndSubmitTransaction, address } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdrawWages = useCallback(
    async (streamId: number) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = withdrawWagesPayload(registryAddr, streamId);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to withdraw wages");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  const withdrawAll = useCallback(
    async () => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = withdrawAllPayload(registryAddr);
        const response = await signAndSubmitTransaction(payload);
        await aptos.waitForTransaction({ transactionHash: response.hash });
        return response.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to withdraw all wages");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, address, registryAddr]
  );

  return {
    withdrawWages,
    withdrawAll,
    loading,
    error,
  };
};
