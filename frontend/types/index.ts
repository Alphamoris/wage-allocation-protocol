// ============ CORE TYPES ============

// Stream Status
export type StreamStatus = "active" | "paused" | "completed" | "terminated" | "disputed";

export const STREAM_STATUS_MAP: Record<number, StreamStatus> = {
  1: "active",
  2: "paused",
  3: "completed",
  4: "terminated",
  5: "disputed",
};

// Treasury Status
export type TreasuryStatus = "healthy" | "warning" | "critical" | "frozen";

export const TREASURY_STATUS_MAP: Record<number, TreasuryStatus> = {
  1: "healthy",
  2: "warning",
  3: "critical",
  4: "frozen",
};

// ============ STREAM TYPES ============

export interface StreamInfo {
  streamId: string;
  employer: string;
  employee: string;
  ratePerSecond: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  startTime: number;
  endTime: number;
  status: number;
}

export interface StreamDisplayInfo extends StreamInfo {
  statusLabel: StreamStatus;
  employeeShort: string;
  employerShort: string;
  totalAmountFormatted: string;
  withdrawnFormatted: string;
  remainingFormatted: string;
  ratePerHourFormatted: string;
  ratePerDayFormatted: string;
  durationDays: number;
  progressPercent: number;
  isActive: boolean;
}

// ============ TREASURY TYPES ============

export interface TreasuryDisplayInfo {
  totalBalance: string;
  totalBalanceRaw: bigint;
  allocatedBalance: string;
  allocatedBalanceRaw: bigint;
  availableBalance: string;
  availableBalanceRaw: bigint;
  reserveBalance: string;
  reserveBalanceRaw: bigint;
  healthPercent: number;
  status: TreasuryStatus;
  activeStreamCount: number;
  isFrozen: boolean;
}

// ============ EMPLOYEE TYPES ============

export interface EmployeeDisplayInfo {
  address: string;
  shortAddress: string;
  streamId: number;
  totalEarned: string;
  totalEarnedRaw: bigint;
  withdrawable: string;
  withdrawableRaw: bigint;
  ratePerHour: string;
  startDate: string;
  status: StreamStatus;
  isActive: boolean;
}

// ============ ACTIVITY TYPES ============

export type ActivityType = "stream_created" | "stream_paused" | "stream_resumed" | "stream_terminated" | "withdrawal" | "deposit" | "claim";

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  amount?: string;
  address?: string;
  shortAddress?: string;
  timestamp: number;
  timeAgo: string;
  txHash?: string;
}

// ============ STATS TYPES ============

export interface DashboardStats {
  totalEmployees: number;
  activeStreams: number;
  monthlyBurn: string;
  monthlyBurnRaw: bigint;
  treasuryBalance: string;
  treasuryBalanceRaw: bigint;
  totalValueLocked: string;
  totalValueLockedRaw: bigint;
}

export interface EmployeeStats {
  totalEarned: string;
  totalEarnedRaw: bigint;
  thisMonth: string;
  thisMonthRaw: bigint;
  withdrawable: string;
  withdrawableRaw: bigint;
  nextPayment: string;
  streakDays: number;
}

// ============ COMPLIANCE TYPES ============

export interface ComplianceInfo {
  isEmployerRegistered: boolean;
  isEmployeeRegistered: boolean;
  epfRate: number;
  esiRate: number;
  tdsRate: number;
  totalDeductions: string;
  netAmount: string;
}

// ============ FORM TYPES ============

export interface CreateStreamFormData {
  employeeAddress: string;
  totalAmount: string;
  durationDays: number;
  jobDescription: string;
}

export interface DepositFormData {
  amount: string;
}

export interface WithdrawFormData {
  amount: string;
}

// ============ TRANSACTION TYPES ============

export type TransactionStatus = "pending" | "success" | "error";

export interface TransactionState {
  status: TransactionStatus;
  hash?: string;
  error?: string;
  message?: string;
}

// ============ UI TYPES ============

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// ============ UTILITY FUNCTIONS ============

export const formatAmount = (octas: bigint | number, decimals: number = 2): string => {
  const apt = Number(octas) / 100_000_000;
  return apt.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatUSD = (octas: bigint | number, aptPrice: number = 10): string => {
  const apt = Number(octas) / 100_000_000;
  const usd = apt * aptPrice;
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  
  return new Date(timestamp * 1000).toLocaleDateString();
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStreamProgress = (stream: StreamInfo): number => {
  const now = Math.floor(Date.now() / 1000);
  const duration = stream.endTime - stream.startTime;
  const elapsed = Math.min(now - stream.startTime, duration);
  return duration > 0 ? (elapsed / duration) * 100 : 0;
};

export const calculateWithdrawable = (stream: StreamInfo): bigint => {
  const now = Math.floor(Date.now() / 1000);
  const effectiveEnd = Math.min(now, stream.endTime);
  const duration = Math.max(0, effectiveEnd - stream.startTime);
  const earned = BigInt(duration) * stream.ratePerSecond;
  return earned - stream.totalWithdrawn;
};

export const getRatePerHour = (ratePerSecond: bigint): bigint => {
  return ratePerSecond * BigInt(3600);
};

export const getRatePerDay = (ratePerSecond: bigint): bigint => {
  return ratePerSecond * BigInt(86400);
};

export const getDurationInDays = (startTime: number, endTime: number): number => {
  return Math.ceil((endTime - startTime) / 86400);
};
