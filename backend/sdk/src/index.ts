/**
 * Daily Wage Allocation Protocol - TypeScript SDK
 * 
 * Complete SDK for interacting with wage streaming, treasury, compliance,
 * disputes, emergency controls, and photon rewards on Aptos blockchain.
 */

import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  AccountAddress,
  Ed25519PrivateKey,
  InputGenerateTransactionPayloadData,
  CommittedTransactionResponse,
  UserTransactionResponse,
} from "@aptos-labs/ts-sdk";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface WageProtocolConfig {
  network: Network;
  moduleAddress: string;
  privateKey?: string;
}

export interface WageStream {
  streamId: string;
  employer: string;
  employee: string;
  wageRatePerSecond: bigint;
  startTime: number;
  endTime: number;
  lastWithdrawalTime: number;
  totalWithdrawn: bigint;
  totalDeposited: bigint;
  status: StreamStatus;
  tokenMetadata: string;
}

export enum StreamStatus {
  Active = 0,
  Paused = 1,
  Completed = 2,
  Cancelled = 3,
}

export interface Treasury {
  employer: string;
  totalDeposited: bigint;
  totalAllocated: bigint;
  totalWithdrawn: bigint;
  availableBalance: bigint;
  reserveRequirement: bigint;
  isActive: boolean;
}

export interface ComplianceRecord {
  employee: string;
  uan: string;
  panNumber: string;
  esiNumber: string;
  totalPayments: number;
  totalGrossWages: bigint;
  totalDeductions: bigint;
}

export interface Dispute {
  disputeId: string;
  streamId: string;
  initiator: string;
  respondent: string;
  disputeType: DisputeType;
  status: DisputeStatus;
  escrowAmount: bigint;
  createdAt: number;
  resolvedAt?: number;
}

export enum DisputeType {
  WageDispute = 0,
  UnauthorizedDeduction = 1,
  TerminationDispute = 2,
  ComplianceViolation = 3,
  Other = 4,
}

export enum DisputeStatus {
  Open = 0,
  UnderReview = 1,
  Arbitration = 2,
  Resolved = 3,
  Appealed = 4,
  Closed = 5,
}

export interface Campaign {
  campaignId: string;
  employer: string;
  name: string;
  status: CampaignStatus;
  totalBudget: bigint;
  distributedAmount: bigint;
  totalParticipants: number;
}

export enum CampaignStatus {
  Draft = 0,
  Active = 1,
  Paused = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface EmployeeRewards {
  employee: string;
  totalPatEarned: bigint;
  totalPatClaimed: bigint;
  pendingPat: bigint;
  currentStreak: number;
  longestStreak: number;
  campaignsParticipated: number;
  engagementScore: number;
}

// ============================================
// MAIN SDK CLASS
// ============================================

export class WageProtocolSDK {
  private aptos: Aptos;
  private moduleAddress: string;
  private account?: Account;

  constructor(config: WageProtocolConfig) {
    const aptosConfig = new AptosConfig({ network: config.network });
    this.aptos = new Aptos(aptosConfig);
    this.moduleAddress = config.moduleAddress;

    if (config.privateKey) {
      const privateKey = new Ed25519PrivateKey(config.privateKey);
      this.account = Account.fromPrivateKey({ privateKey });
    }
  }

  // ============================================
  // WAGE STREAMING FUNCTIONS
  // ============================================

  /**
   * Create a new wage stream for an employee
   */
  async createWageStream(
    employeeAddress: string,
    wageRatePerSecond: bigint,
    startTime: number,
    endTime: number,
    tokenMetadata: string,
    depositAmount: bigint
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::wage_streaming::create_stream`,
      functionArguments: [
        employeeAddress,
        wageRatePerSecond.toString(),
        startTime,
        endTime,
        tokenMetadata,
        depositAmount.toString(),
      ],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Withdraw accrued wages from a stream
   */
  async withdrawWages(streamAddress: string): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::wage_streaming::withdraw_wages`,
      functionArguments: [streamAddress],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Pause an active wage stream
   */
  async pauseStream(streamAddress: string): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::wage_streaming::pause_stream`,
      functionArguments: [streamAddress],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Resume a paused wage stream
   */
  async resumeStream(streamAddress: string): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::wage_streaming::resume_stream`,
      functionArguments: [streamAddress],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Terminate a wage stream
   */
  async terminateStream(streamAddress: string): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::wage_streaming::terminate_stream`,
      functionArguments: [streamAddress],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Get stream information
   */
  async getStreamInfo(streamAddress: string): Promise<WageStream> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::wage_streaming::get_stream_info`,
        functionArguments: [streamAddress],
      },
    });

    return this.parseStreamInfo(result);
  }

  /**
   * Calculate current accrued wages
   */
  async getAccruedWages(streamAddress: string): Promise<bigint> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::wage_streaming::get_accrued_wages`,
        functionArguments: [streamAddress],
      },
    });

    return BigInt(result[0] as string);
  }

  // ============================================
  // TREASURY FUNCTIONS
  // ============================================

  /**
   * Initialize employer treasury
   */
  async initializeTreasury(
    reservePercentage: number,
    tokenMetadata: string
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::employer_treasury::initialize_treasury`,
      functionArguments: [reservePercentage, tokenMetadata],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Deposit funds to treasury
   */
  async depositToTreasury(
    amount: bigint,
    tokenMetadata: string
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::employer_treasury::deposit_funds`,
      functionArguments: [amount.toString(), tokenMetadata],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Withdraw surplus funds from treasury
   */
  async withdrawFromTreasury(amount: bigint): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::employer_treasury::withdraw_surplus`,
      functionArguments: [amount.toString()],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Get treasury balance and info
   */
  async getTreasuryInfo(employerAddress: string): Promise<Treasury> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::employer_treasury::get_treasury_info`,
        functionArguments: [employerAddress],
      },
    });

    return this.parseTreasuryInfo(result, employerAddress);
  }

  // ============================================
  // COMPLIANCE FUNCTIONS
  // ============================================

  /**
   * Initialize employee compliance record
   */
  async initializeEmployeeCompliance(
    employerAddress: string,
    uan: string,
    esiNumber: string,
    panNumber: string
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::compliance::initialize_employee_compliance`,
      functionArguments: [employerAddress, uan, esiNumber, panNumber],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Calculate statutory deductions (EPF, ESI, TDS)
   */
  async calculateDeductions(
    monthlyGross: bigint,
    annualIncome: bigint,
    registryAddress: string
  ): Promise<{ epf: bigint; esi: bigint; tds: bigint; total: bigint }> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::compliance::calculate_total_deductions`,
        functionArguments: [
          monthlyGross.toString(),
          annualIncome.toString(),
          registryAddress,
        ],
      },
    });

    return {
      epf: BigInt(result[0] as string),
      esi: BigInt(result[1] as string),
      tds: BigInt(result[2] as string),
      total: BigInt(result[3] as string),
    };
  }

  /**
   * Get employee compliance status
   */
  async getComplianceStatus(
    employeeAddress: string
  ): Promise<{ hasUan: boolean; hasEsi: boolean; hasPan: boolean }> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::compliance::get_employee_compliance_status`,
        functionArguments: [employeeAddress],
      },
    });

    return {
      hasUan: result[0] as boolean,
      hasEsi: result[1] as boolean,
      hasPan: result[2] as boolean,
    };
  }

  // ============================================
  // DISPUTE FUNCTIONS
  // ============================================

  /**
   * Create a new dispute
   */
  async createDispute(
    streamAddress: string,
    disputeType: DisputeType,
    description: string,
    requestedAmount: bigint,
    registryAddress: string
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::disputes::create_dispute`,
      functionArguments: [
        streamAddress,
        disputeType,
        description,
        requestedAmount.toString(),
        registryAddress,
      ],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Submit evidence for a dispute
   */
  async submitEvidence(
    disputeAddress: string,
    evidenceType: number,
    description: string,
    dataHash: string
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::disputes::submit_evidence`,
      functionArguments: [disputeAddress, evidenceType, description, dataHash],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Deposit to escrow for dispute
   */
  async depositToEscrow(
    disputeAddress: string,
    amount: bigint,
    tokenMetadata: string
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::disputes::deposit_to_escrow`,
      functionArguments: [disputeAddress, amount.toString(), tokenMetadata],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Get dispute information
   */
  async getDisputeInfo(disputeAddress: string): Promise<Dispute> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::disputes::get_dispute_info`,
        functionArguments: [disputeAddress],
      },
    });

    return this.parseDisputeInfo(result);
  }

  // ============================================
  // EMERGENCY FUNCTIONS
  // ============================================

  /**
   * Check if system is paused
   */
  async isSystemPaused(registryAddress: string): Promise<boolean> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::emergency::is_system_paused`,
        functionArguments: [registryAddress],
      },
    });

    return result[0] as boolean;
  }

  /**
   * Get current pause level
   */
  async getPauseLevel(registryAddress: string): Promise<number> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::emergency::get_pause_level`,
        functionArguments: [registryAddress],
      },
    });

    return result[0] as number;
  }

  /**
   * Check if address is admin
   */
  async isAdmin(adminAddress: string, registryAddress: string): Promise<boolean> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::emergency::is_admin`,
        functionArguments: [adminAddress, registryAddress],
      },
    });

    return result[0] as boolean;
  }

  // ============================================
  // PHOTON REWARDS FUNCTIONS
  // ============================================

  /**
   * Initialize employee rewards tracking
   */
  async initializeEmployeeRewards(): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::photon_rewards::initialize_employee_rewards`,
      functionArguments: [],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Record daily check-in for streak
   */
  async recordDailyCheckin(): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::photon_rewards::record_daily_checkin`,
      functionArguments: [],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Register for a campaign
   */
  async registerForCampaign(
    campaignAddress: string,
    registryAddress: string
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::photon_rewards::register_for_campaign`,
      functionArguments: [campaignAddress, registryAddress],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Claim earned rewards
   */
  async claimRewards(
    campaignAddress: string,
    registryAddress: string
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const payload: InputGenerateTransactionPayloadData = {
      function: `${this.moduleAddress}::photon_rewards::claim_rewards`,
      functionArguments: [campaignAddress, registryAddress],
    };

    return this.submitTransaction(payload);
  }

  /**
   * Get employee rewards summary
   */
  async getEmployeeRewardsSummary(employeeAddress: string): Promise<EmployeeRewards> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::photon_rewards::get_employee_rewards_summary`,
        functionArguments: [employeeAddress],
      },
    });

    return {
      employee: employeeAddress,
      totalPatEarned: BigInt(result[0] as string),
      totalPatClaimed: BigInt(result[1] as string),
      pendingPat: BigInt(result[2] as string),
      currentStreak: Number(result[3]),
      longestStreak: 0, // Not returned by view function
      campaignsParticipated: Number(result[4]),
      engagementScore: Number(result[5]),
    };
  }

  /**
   * Get streak information
   */
  async getStreakInfo(
    employeeAddress: string
  ): Promise<{ currentStreak: number; longestStreak: number; streakRewards: bigint }> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::photon_rewards::get_streak_info`,
        functionArguments: [employeeAddress],
      },
    });

    return {
      currentStreak: Number(result[0]),
      longestStreak: Number(result[1]),
      streakRewards: BigInt(result[2] as string),
    };
  }

  /**
   * Get campaign info
   */
  async getCampaignInfo(campaignAddress: string): Promise<Campaign> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::photon_rewards::get_campaign_info`,
        functionArguments: [campaignAddress],
      },
    });

    return {
      campaignId: result[0] as string,
      employer: result[1] as string,
      name: result[2] as string,
      status: Number(result[3]) as CampaignStatus,
      totalBudget: BigInt(result[4] as string),
      distributedAmount: BigInt(result[5] as string),
      totalParticipants: Number(result[6]),
    };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  private async submitTransaction(
    payload: InputGenerateTransactionPayloadData
  ): Promise<CommittedTransactionResponse> {
    if (!this.account) throw new Error("Account not initialized");

    const transaction = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: payload,
    });

    const pendingTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.account,
      transaction,
    });

    return this.aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });
  }

  private parseStreamInfo(result: any[]): WageStream {
    return {
      streamId: result[0] as string,
      employer: result[1] as string,
      employee: result[2] as string,
      wageRatePerSecond: BigInt(result[3] as string),
      startTime: Number(result[4]),
      endTime: Number(result[5]),
      lastWithdrawalTime: Number(result[6]),
      totalWithdrawn: BigInt(result[7] as string),
      totalDeposited: BigInt(result[8] as string),
      status: Number(result[9]) as StreamStatus,
      tokenMetadata: result[10] as string,
    };
  }

  private parseTreasuryInfo(result: any[], employer: string): Treasury {
    return {
      employer,
      totalDeposited: BigInt(result[0] as string),
      totalAllocated: BigInt(result[1] as string),
      totalWithdrawn: BigInt(result[2] as string),
      availableBalance: BigInt(result[3] as string),
      reserveRequirement: BigInt(result[4] as string),
      isActive: result[5] as boolean,
    };
  }

  private parseDisputeInfo(result: any[]): Dispute {
    return {
      disputeId: result[0] as string,
      streamId: result[1] as string,
      initiator: result[2] as string,
      respondent: result[3] as string,
      disputeType: Number(result[4]) as DisputeType,
      status: Number(result[5]) as DisputeStatus,
      escrowAmount: BigInt(result[6] as string),
      createdAt: Number(result[7]),
      resolvedAt: result[8] ? Number(result[8]) : undefined,
    };
  }

  /**
   * Get the connected account address
   */
  getAccountAddress(): string | undefined {
    return this.account?.accountAddress.toString();
  }

  /**
   * Set account from private key
   */
  setAccount(privateKey: string): void {
    const pk = new Ed25519PrivateKey(privateKey);
    this.account = Account.fromPrivateKey({ privateKey: pk });
  }

  /**
   * Get Aptos client instance for direct access
   */
  getAptosClient(): Aptos {
    return this.aptos;
  }
}

// ============================================
// EXPORTS
// ============================================

export default WageProtocolSDK;
