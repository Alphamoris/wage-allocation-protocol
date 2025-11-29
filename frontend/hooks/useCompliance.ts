"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { CONTRACT_ADDRESS } from "@/lib/aptos/config";
import {
  EmployeeComplianceStatus,
  EmployerComplianceStatus,
  EmployerComplianceSummary,
  StatutoryRates,
  StreamComplianceInfo,
  CertificateVerification,
  DeductionInfo,
  getEmployeeStatus,
  getEmployerStatus,
  getEmployerComplianceSummary,
  getStatutoryRates,
  getStreamCompliance,
  verifyCertificate,
  isEmployeeRegistered,
  isEmployerRegistered,
  calculateDeductions,
} from "@/lib/aptos/compliance";

// Hook for employee compliance status
export const useEmployeeComplianceStatus = (employeeAddress?: string) => {
  const { address } = useAuth();
  const [status, setStatus] = useState<EmployeeComplianceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetAddress = employeeAddress || address;

  const fetchStatus = useCallback(async () => {
    if (!targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getEmployeeStatus(targetAddress);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch employee status");
    } finally {
      setLoading(false);
    }
  }, [targetAddress]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};

// Hook for employer compliance status
export const useEmployerComplianceStatus = (employerAddress?: string) => {
  const { address } = useAuth();
  const [status, setStatus] = useState<EmployerComplianceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetAddress = employerAddress || address;

  const fetchStatus = useCallback(async () => {
    if (!targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getEmployerStatus(targetAddress);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch employer status");
    } finally {
      setLoading(false);
    }
  }, [targetAddress]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};

// Hook for employer compliance summary
export const useEmployerComplianceSummary = (employerAddress?: string) => {
  const { address } = useAuth();
  const [summary, setSummary] = useState<EmployerComplianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetAddress = employerAddress || address;

  const fetchSummary = useCallback(async () => {
    if (!targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getEmployerComplianceSummary(targetAddress);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch compliance summary");
    } finally {
      setLoading(false);
    }
  }, [targetAddress]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
};

// Hook for statutory rates
export const useStatutoryRates = (registryAddress?: string) => {
  const [rates, setRates] = useState<StatutoryRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getStatutoryRates(registryAddr);
      setRates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch statutory rates");
    } finally {
      setLoading(false);
    }
  }, [registryAddr]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { rates, loading, error, refetch: fetchRates };
};

// Hook for stream compliance
export const useStreamCompliance = (streamId: number, registryAddress?: string) => {
  const [compliance, setCompliance] = useState<StreamComplianceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchCompliance = useCallback(async () => {
    if (!streamId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getStreamCompliance(registryAddr, streamId);
      setCompliance(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stream compliance");
    } finally {
      setLoading(false);
    }
  }, [registryAddr, streamId]);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  return { compliance, loading, error, refetch: fetchCompliance };
};

// Hook for certificate verification
export const useCertificateVerification = (certificateId: number, registryAddress?: string) => {
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryAddr = registryAddress || CONTRACT_ADDRESS;

  const fetchVerification = useCallback(async () => {
    if (!certificateId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verifyCertificate(registryAddr, certificateId);
      setVerification(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify certificate");
    } finally {
      setLoading(false);
    }
  }, [registryAddr, certificateId]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  return { verification, loading, error, refetch: fetchVerification };
};

// Hook for checking registration status
export const useComplianceRegistration = () => {
  const { address } = useAuth();
  const [isEmployeeReg, setIsEmployeeReg] = useState(false);
  const [isEmployerReg, setIsEmployerReg] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkRegistration = useCallback(async () => {
    if (!address) return;

    setLoading(true);

    try {
      const [employeeReg, employerReg] = await Promise.all([
        isEmployeeRegistered(address),
        isEmployerRegistered(address),
      ]);
      setIsEmployeeReg(employeeReg);
      setIsEmployerReg(employerReg);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    checkRegistration();
  }, [checkRegistration]);

  return { isEmployeeRegistered: isEmployeeReg, isEmployerRegistered: isEmployerReg, loading, refetch: checkRegistration };
};

// Hook for calculating deductions
export const useDeductionCalculator = () => {
  const [deductions, setDeductions] = useState<DeductionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (
    registryAddr: string,
    grossWage: bigint,
    employeeAddr: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await calculateDeductions(registryAddr, grossWage, employeeAddr);
      setDeductions(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate deductions");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deductions, loading, error, calculate };
};
