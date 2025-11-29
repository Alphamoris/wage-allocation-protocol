"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { CONTRACT_ADDRESS } from "@/lib/aptos/config";
import {
  DisputeInfo,
  ResolutionInfo,
  DisputeStats,
  disputeExists,
  getActiveArbitratorsCount,
  getDispute,
  getDisputeStats,
  getEvidenceCount,
  getResolution,
} from "@/lib/aptos/disputes";

// Hook for checking if a dispute exists
export const useDisputeExists = (disputeId: number, registryAddress?: string) => {
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const checkExists = useCallback(async () => {
    if (!disputeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await disputeExists(registryAddr, disputeId);
      setExists(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check dispute existence");
    } finally {
      setLoading(false);
    }
  }, [registryAddr, disputeId]);

  useEffect(() => {
    checkExists();
  }, [checkExists]);

  return { exists, loading, error, refetch: checkExists };
};

// Hook for fetching dispute details
export const useDispute = (disputeId: number, registryAddress?: string) => {
  const [dispute, setDispute] = useState<DisputeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchDispute = useCallback(async () => {
    if (!disputeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getDispute(registryAddr, disputeId);
      setDispute(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dispute");
    } finally {
      setLoading(false);
    }
  }, [registryAddr, disputeId]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  return { dispute, loading, error, refetch: fetchDispute };
};

// Hook for fetching dispute resolution
export const useResolution = (disputeId: number, registryAddress?: string) => {
  const [resolution, setResolution] = useState<ResolutionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchResolution = useCallback(async () => {
    if (!disputeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getResolution(registryAddr, disputeId);
      setResolution(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch resolution");
    } finally {
      setLoading(false);
    }
  }, [registryAddr, disputeId]);

  useEffect(() => {
    fetchResolution();
  }, [fetchResolution]);

  return { resolution, loading, error, refetch: fetchResolution };
};

// Hook for fetching dispute statistics
export const useDisputeStats = (registryAddress?: string) => {
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDisputeStats(registryAddr);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dispute stats");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook for fetching evidence count
export const useEvidenceCount = (disputeId: number, registryAddress?: string) => {
  const [count, setCount] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchCount = useCallback(async () => {
    if (!disputeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getEvidenceCount(registryAddr, disputeId);
      setCount(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch evidence count");
    } finally {
      setLoading(false);
    }
  }, [registryAddr, disputeId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, error, refetch: fetchCount };
};

// Hook for fetching active arbitrators count
export const useActiveArbitratorsCount = (registryAddress?: string) => {
  const [count, setCount] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchCount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getActiveArbitratorsCount(registryAddr);
      setCount(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch arbitrators count");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, error, refetch: fetchCount };
};

// Combined hook for dispute details with resolution
export const useDisputeWithResolution = (disputeId: number, registryAddress?: string) => {
  const { dispute, loading: disputeLoading, error: disputeError, refetch: refetchDispute } = 
    useDispute(disputeId, registryAddress);
  const { resolution, loading: resolutionLoading, error: resolutionError, refetch: refetchResolution } = 
    useResolution(disputeId, registryAddress);
  const { count: evidenceCount, loading: evidenceLoading, refetch: refetchEvidence } = 
    useEvidenceCount(disputeId, registryAddress);

  const loading = disputeLoading || resolutionLoading || evidenceLoading;
  const error = disputeError || resolutionError;

  const refetch = useCallback(async () => {
    await Promise.all([refetchDispute(), refetchResolution(), refetchEvidence()]);
  }, [refetchDispute, refetchResolution, refetchEvidence]);

  return { 
    dispute, 
    resolution, 
    evidenceCount,
    loading, 
    error, 
    refetch 
  };
};
