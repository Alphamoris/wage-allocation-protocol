"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { CONTRACT_ADDRESS } from "@/lib/aptos/config";
import {
  SystemState,
  getAdminCount,
  getSystemState,
  hasRole,
  isModulePaused,
  isSystemPaused,
  isUpgradePending,
  ROLE,
  MODULE_INDEX,
} from "@/lib/aptos/emergency";

// Hook for system state
export const useSystemState = (registryAddress?: string) => {
  const [state, setState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSystemState(registryAddr);
      setState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch system state");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchState, 30000);
    return () => clearInterval(interval);
  }, [fetchState]);

  return { state, loading, error, refetch: fetchState };
};

// Hook for checking if system is paused
export const useSystemPaused = (registryAddress?: string) => {
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const checkPaused = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await isSystemPaused(registryAddr);
      setIsPaused(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check system pause status");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    checkPaused();
  }, [checkPaused]);

  // Refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(checkPaused, 10000);
    return () => clearInterval(interval);
  }, [checkPaused]);

  return { isPaused, loading, error, refetch: checkPaused };
};

// Hook for checking if a specific module is paused
export const useModulePaused = (moduleIndex: number, registryAddress?: string) => {
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const checkPaused = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await isModulePaused(registryAddr, moduleIndex);
      setIsPaused(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check module pause status");
    } finally {
      setLoading(false);
    }
  }, [registryAddr, moduleIndex]);

  useEffect(() => {
    checkPaused();
  }, [checkPaused]);

  return { isPaused, loading, error, refetch: checkPaused };
};

// Hook for checking user roles
export const useUserRole = (role: number, registryAddress?: string) => {
  const { address } = useAuth();
  const [hasUserRole, setHasUserRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const checkRole = useCallback(async () => {
    if (!address) {
      setHasUserRole(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await hasRole(registryAddr, address, role);
      setHasUserRole(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check user role");
    } finally {
      setLoading(false);
    }
  }, [registryAddr, address, role]);

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  return { hasRole: hasUserRole, loading, error, refetch: checkRole };
};

// Hook for admin count
export const useAdminCount = (registryAddress?: string) => {
  const [count, setCount] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchCount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAdminCount(registryAddr);
      setCount(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch admin count");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, error, refetch: fetchCount };
};

// Hook for checking upgrade status
export const useUpgradePending = (registryAddress?: string) => {
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const checkPending = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await isUpgradePending(registryAddr);
      setIsPending(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check upgrade status");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    checkPending();
  }, [checkPending]);

  return { isPending, loading, error, refetch: checkPending };
};

// Combined hook for all pause statuses
export const useAllModulePauseStatus = (registryAddress?: string) => {
  const [pauseStatus, setPauseStatus] = useState({
    system: false,
    wageStreaming: false,
    treasury: false,
    compliance: false,
    disputes: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchAllStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [system, wageStreaming, treasury, compliance, disputes] = await Promise.all([
        isSystemPaused(registryAddr),
        isModulePaused(registryAddr, MODULE_INDEX.WAGE_STREAMING),
        isModulePaused(registryAddr, MODULE_INDEX.TREASURY),
        isModulePaused(registryAddr, MODULE_INDEX.COMPLIANCE),
        isModulePaused(registryAddr, MODULE_INDEX.DISPUTES),
      ]);

      setPauseStatus({
        system,
        wageStreaming,
        treasury,
        compliance,
        disputes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pause statuses");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    fetchAllStatus();
  }, [fetchAllStatus]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAllStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchAllStatus]);

  return { pauseStatus, loading, error, refetch: fetchAllStatus };
};

// Hook for checking if user is admin
export const useIsAdmin = (registryAddress?: string) => {
  const { hasRole: isSuperAdmin, loading: superLoading } = useUserRole(ROLE.SUPER_ADMIN, registryAddress);
  const { hasRole: isAdmin, loading: adminLoading } = useUserRole(ROLE.ADMIN, registryAddress);

  return {
    isAdmin: isSuperAdmin || isAdmin,
    isSuperAdmin,
    loading: superLoading || adminLoading,
  };
};
