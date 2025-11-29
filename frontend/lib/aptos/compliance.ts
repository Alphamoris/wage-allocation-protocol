import { aptos, MODULES, CONTRACT_ADDRESS } from "./config";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Types
export interface DeductionInfo {
  epfEmployee: bigint;
  epfEmployer: bigint;
  esiEmployee: bigint;
  esiEmployer: bigint;
  tds: bigint;
  professionalTax: bigint;
  netPayable: bigint;
}

export interface EmployeeComplianceStatus {
  status: number;
  epfMember: boolean;
  esiEligible: boolean;
  kycVerified: boolean;
}

export interface EmployerComplianceStatus {
  status: number;
  epfRegistered: boolean;
  esiRegistered: boolean;
  employeeCount: bigint;
}

export interface EmployerComplianceSummary {
  totalEpf: bigint;
  totalEsi: bigint;
  totalTds: bigint;
}

export interface StatutoryRates {
  epfEmployeeRate: bigint;
  epfEmployerRate: bigint;
  esiEmployeeRate: bigint;
  esiEmployerRate: bigint;
}

export interface StreamComplianceInfo {
  epfDeducted: bigint;
  esiDeducted: bigint;
  tdsDeducted: bigint;
  ptDeducted: bigint;
  netPayable: bigint;
  isCompliant: boolean;
}

export interface CertificateVerification {
  isValid: boolean;
  issuedAt: number;
  validUntil: number;
}

// Compliance Status Constants
export const COMPLIANCE_STATUS = {
  PENDING: 1,
  VERIFIED: 2,
  FLAGGED: 3,
  EXEMPT: 4,
} as const;

// ============ VIEW FUNCTIONS ============

/**
 * Calculate deductions for a given wage amount
 */
export const calculateDeductions = async (
  registryAddr: string,
  grossWage: bigint,
  employeeAddr: string
): Promise<DeductionInfo | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::calculate_deductions`,
        functionArguments: [registryAddr, grossWage.toString(), employeeAddr],
      },
    });

    const [epfEmployee, epfEmployer, esiEmployee, esiEmployer, tds, professionalTax, netPayable] = result as [
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ];

    return {
      epfEmployee: BigInt(epfEmployee),
      epfEmployer: BigInt(epfEmployer),
      esiEmployee: BigInt(esiEmployee),
      esiEmployer: BigInt(esiEmployer),
      tds: BigInt(tds),
      professionalTax: BigInt(professionalTax),
      netPayable: BigInt(netPayable),
    };
  } catch (error) {
    console.error("Error calculating deductions:", error);
    return null;
  }
};

/**
 * Get employee compliance status
 */
export const getEmployeeStatus = async (
  employeeAddr: string
): Promise<EmployeeComplianceStatus | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::get_employee_status`,
        functionArguments: [employeeAddr],
      },
    });

    const [status, epfMember, esiEligible, kycVerified] = result as [
      number,
      boolean,
      boolean,
      boolean
    ];

    return {
      status,
      epfMember,
      esiEligible,
      kycVerified,
    };
  } catch (error) {
    console.error("Error fetching employee status:", error);
    return null;
  }
};

/**
 * Get employer compliance summary
 */
export const getEmployerComplianceSummary = async (
  employerAddr: string
): Promise<EmployerComplianceSummary | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::get_employer_compliance_summary`,
        functionArguments: [employerAddr],
      },
    });

    const [totalEpf, totalEsi, totalTds] = result as [string, string, string];

    return {
      totalEpf: BigInt(totalEpf),
      totalEsi: BigInt(totalEsi),
      totalTds: BigInt(totalTds),
    };
  } catch (error) {
    console.error("Error fetching employer compliance summary:", error);
    return null;
  }
};

/**
 * Get employer compliance status
 */
export const getEmployerStatus = async (
  employerAddr: string
): Promise<EmployerComplianceStatus | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::get_employer_status`,
        functionArguments: [employerAddr],
      },
    });

    const [status, epfRegistered, esiRegistered, employeeCount] = result as [
      number,
      boolean,
      boolean,
      string
    ];

    return {
      status,
      epfRegistered,
      esiRegistered,
      employeeCount: BigInt(employeeCount),
    };
  } catch (error) {
    console.error("Error fetching employer status:", error);
    return null;
  }
};

/**
 * Get current statutory rates
 */
export const getStatutoryRates = async (
  registryAddr: string
): Promise<StatutoryRates | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::get_statutory_rates`,
        functionArguments: [registryAddr],
      },
    });

    const [epfEmployeeRate, epfEmployerRate, esiEmployeeRate, esiEmployerRate] =
      result as [string, string, string, string];

    return {
      epfEmployeeRate: BigInt(epfEmployeeRate),
      epfEmployerRate: BigInt(epfEmployerRate),
      esiEmployeeRate: BigInt(esiEmployeeRate),
      esiEmployerRate: BigInt(esiEmployerRate),
    };
  } catch (error) {
    console.error("Error fetching statutory rates:", error);
    return null;
  }
};

/**
 * Get stream compliance details
 */
export const getStreamCompliance = async (
  registryAddr: string,
  streamId: number
): Promise<StreamComplianceInfo | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::get_stream_compliance`,
        functionArguments: [registryAddr, streamId],
      },
    });

    const [epfDeducted, esiDeducted, tdsDeducted, ptDeducted, netPayable, isCompliant] =
      result as [string, string, string, string, string, boolean];

    return {
      epfDeducted: BigInt(epfDeducted),
      esiDeducted: BigInt(esiDeducted),
      tdsDeducted: BigInt(tdsDeducted),
      ptDeducted: BigInt(ptDeducted),
      netPayable: BigInt(netPayable),
      isCompliant,
    };
  } catch (error) {
    console.error("Error fetching stream compliance:", error);
    return null;
  }
};

/**
 * Check if employee is registered for compliance
 */
export const isEmployeeRegistered = async (
  employeeAddr: string
): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::is_employee_registered`,
        functionArguments: [employeeAddr],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking employee registration:", error);
    return false;
  }
};

/**
 * Check if employer is registered for compliance
 */
export const isEmployerRegistered = async (
  employerAddr: string
): Promise<boolean> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::is_employer_registered`,
        functionArguments: [employerAddr],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking employer registration:", error);
    return false;
  }
};

/**
 * Verify a compliance certificate
 */
export const verifyCertificate = async (
  registryAddr: string,
  certificateId: number
): Promise<CertificateVerification | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULES.COMPLIANCE}::verify_certificate`,
        functionArguments: [registryAddr, certificateId],
      },
    });

    const [isValid, issuedAt, validUntil] = result as [boolean, string, string];

    return {
      isValid,
      issuedAt: Number(issuedAt),
      validUntil: Number(validUntil),
    };
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return null;
  }
};

// ============ TRANSACTION PAYLOADS ============

/**
 * Register employer for compliance
 */
export const registerEmployerPayload = (
  registryAddr: string,
  panHash: Uint8Array,
  gstinHash: Uint8Array,
  epfCodeHash: Uint8Array,
  esiCodeHash: Uint8Array,
  stateCode: number,
  epfRegistered: boolean,
  esiRegistered: boolean
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.COMPLIANCE}::register_employer`,
      functionArguments: [
        registryAddr,
        Array.from(panHash),
        Array.from(gstinHash),
        Array.from(epfCodeHash),
        Array.from(esiCodeHash),
        stateCode,
        epfRegistered,
        esiRegistered,
      ],
    },
  };
};

/**
 * Register employee for compliance
 */
export const registerEmployeePayload = (
  registryAddr: string,
  panHash: Uint8Array,
  aadhaarHash: Uint8Array,
  uanHash: Uint8Array,
  bankAccountHash: Uint8Array,
  taxRegime: number,
  declaredAnnualIncome: bigint,
  epfMember: boolean,
  esiEligible: boolean
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.COMPLIANCE}::register_employee`,
      functionArguments: [
        registryAddr,
        Array.from(panHash),
        Array.from(aadhaarHash),
        Array.from(uanHash),
        Array.from(bankAccountHash),
        taxRegime,
        declaredAnnualIncome.toString(),
        epfMember,
        esiEligible,
      ],
    },
  };
};

/**
 * Record stream compliance
 */
export const recordStreamCompliancePayload = (
  registryAddr: string,
  streamId: number,
  employerAddr: string,
  employeeAddr: string,
  totalWages: bigint
): InputTransactionData => {
  return {
    data: {
      function: `${MODULES.COMPLIANCE}::record_stream_compliance`,
      functionArguments: [
        registryAddr,
        streamId,
        employerAddr,
        employeeAddr,
        totalWages.toString(),
      ],
    },
  };
};
