/**
 * Daily Wage Allocation Protocol - SDK Usage Examples
 * 
 * This file demonstrates how to use the TypeScript SDK for common operations.
 */

import { WageProtocolSDK, StreamStatus, DisputeType } from './index';
import { Network } from '@aptos-labs/ts-sdk';

// ============================================
// CONFIGURATION
// ============================================

const MODULE_ADDRESS = '0xYOUR_MODULE_ADDRESS'; // Replace with deployed address

// Initialize SDK for testnet
const sdk = new WageProtocolSDK({
  network: Network.TESTNET,
  moduleAddress: MODULE_ADDRESS,
  privateKey: process.env.PRIVATE_KEY, // Optional - for signing transactions
});

// ============================================
// EMPLOYER EXAMPLES
// ============================================

async function employerExamples() {
  console.log('=== Employer Operations ===\n');

  // 1. Initialize Treasury
  console.log('1. Initializing treasury...');
  const treasuryTx = await sdk.initializeTreasury(
    2000, // 20% reserve requirement
    '0x1::aptos_coin::AptosCoin' // Token metadata
  );
  console.log(`Treasury initialized: ${treasuryTx.hash}\n`);

  // 2. Deposit funds to treasury
  console.log('2. Depositing funds...');
  const depositAmount = BigInt(100000000000); // 1000 tokens (6 decimals)
  const depositTx = await sdk.depositToTreasury(
    depositAmount,
    '0x1::aptos_coin::AptosCoin'
  );
  console.log(`Deposited ${depositAmount}: ${depositTx.hash}\n`);

  // 3. Create wage stream for employee
  console.log('3. Creating wage stream...');
  const employeeAddress = '0xEMPLOYEE_ADDRESS';
  const wageRatePerSecond = BigInt(1000); // 1000 micro-tokens per second
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + (30 * 24 * 60 * 60); // 30 days
  
  const streamTx = await sdk.createWageStream(
    employeeAddress,
    wageRatePerSecond,
    startTime,
    endTime,
    '0x1::aptos_coin::AptosCoin',
    BigInt(2592000000) // Deposit for 30 days of wages
  );
  console.log(`Stream created: ${streamTx.hash}\n`);

  // 4. Check treasury status
  console.log('4. Checking treasury status...');
  const treasuryInfo = await sdk.getTreasuryInfo(sdk.getAccountAddress()!);
  console.log('Treasury Info:', {
    totalDeposited: treasuryInfo.totalDeposited.toString(),
    availableBalance: treasuryInfo.availableBalance.toString(),
    reserveRequirement: treasuryInfo.reserveRequirement.toString(),
  });
}

// ============================================
// EMPLOYEE EXAMPLES
// ============================================

async function employeeExamples() {
  console.log('\n=== Employee Operations ===\n');

  const streamAddress = '0xSTREAM_ADDRESS';

  // 1. Check accrued wages
  console.log('1. Checking accrued wages...');
  const accruedWages = await sdk.getAccruedWages(streamAddress);
  console.log(`Accrued wages: ${accruedWages.toString()}\n`);

  // 2. Withdraw wages
  console.log('2. Withdrawing wages...');
  const withdrawTx = await sdk.withdrawWages(streamAddress);
  console.log(`Withdrawal complete: ${withdrawTx.hash}\n`);

  // 3. Get stream info
  console.log('3. Getting stream info...');
  const streamInfo = await sdk.getStreamInfo(streamAddress);
  console.log('Stream Info:', {
    employer: streamInfo.employer,
    wageRate: streamInfo.wageRatePerSecond.toString(),
    totalWithdrawn: streamInfo.totalWithdrawn.toString(),
    status: StreamStatus[streamInfo.status],
  });

  // 4. Initialize rewards tracking
  console.log('\n4. Initializing rewards...');
  const rewardsTx = await sdk.initializeEmployeeRewards();
  console.log(`Rewards initialized: ${rewardsTx.hash}\n`);

  // 5. Daily check-in for streak
  console.log('5. Recording daily check-in...');
  const checkinTx = await sdk.recordDailyCheckin();
  console.log(`Check-in recorded: ${checkinTx.hash}\n`);

  // 6. Get streak info
  console.log('6. Getting streak info...');
  const streakInfo = await sdk.getStreakInfo(sdk.getAccountAddress()!);
  console.log('Streak Info:', {
    currentStreak: streakInfo.currentStreak,
    longestStreak: streakInfo.longestStreak,
    rewards: streakInfo.streakRewards.toString(),
  });
}

// ============================================
// COMPLIANCE EXAMPLES
// ============================================

async function complianceExamples() {
  console.log('\n=== Compliance Operations ===\n');

  const registryAddress = MODULE_ADDRESS;
  const employeeAddress = sdk.getAccountAddress()!;

  // 1. Initialize employee compliance record
  console.log('1. Initializing compliance record...');
  const complianceTx = await sdk.initializeEmployeeCompliance(
    '0xEMPLOYER_ADDRESS',
    'MHPUN1234567000123', // UAN
    '1234567890123',       // ESI Number
    'ABCDE1234F'           // PAN
  );
  console.log(`Compliance initialized: ${complianceTx.hash}\n`);

  // 2. Calculate deductions
  console.log('2. Calculating statutory deductions...');
  const monthlyGross = BigInt(25000000000); // ₹25,000
  const annualIncome = monthlyGross * BigInt(12);
  
  const deductions = await sdk.calculateDeductions(
    monthlyGross,
    annualIncome,
    registryAddress
  );
  console.log('Deductions:', {
    EPF: deductions.epf.toString(),
    ESI: deductions.esi.toString(),
    TDS: deductions.tds.toString(),
    Total: deductions.total.toString(),
    NetPay: (monthlyGross - deductions.total).toString(),
  });

  // 3. Check compliance status
  console.log('\n3. Checking compliance status...');
  const status = await sdk.getComplianceStatus(employeeAddress);
  console.log('Compliance Status:', status);
}

// ============================================
// DISPUTE EXAMPLES
// ============================================

async function disputeExamples() {
  console.log('\n=== Dispute Operations ===\n');

  const streamAddress = '0xSTREAM_ADDRESS';
  const registryAddress = MODULE_ADDRESS;

  // 1. Create a dispute
  console.log('1. Creating dispute...');
  const disputeTx = await sdk.createDispute(
    streamAddress,
    DisputeType.WageDispute,
    'Wages not paid for overtime hours worked on 2024-01-15',
    BigInt(5000000000), // Requesting ₹5,000
    registryAddress
  );
  console.log(`Dispute created: ${disputeTx.hash}\n`);

  // 2. Submit evidence
  console.log('2. Submitting evidence...');
  const disputeAddress = '0xDISPUTE_ADDRESS';
  const evidenceTx = await sdk.submitEvidence(
    disputeAddress,
    1, // Document type
    'Timesheet showing 10 hours of overtime',
    '0x1234...abcd' // IPFS hash of document
  );
  console.log(`Evidence submitted: ${evidenceTx.hash}\n`);

  // 3. Deposit to escrow
  console.log('3. Depositing to escrow...');
  const escrowTx = await sdk.depositToEscrow(
    disputeAddress,
    BigInt(1000000000), // ₹1,000 filing fee
    '0x1::aptos_coin::AptosCoin'
  );
  console.log(`Escrow deposited: ${escrowTx.hash}\n`);

  // 4. Get dispute info
  console.log('4. Getting dispute info...');
  const disputeInfo = await sdk.getDisputeInfo(disputeAddress);
  console.log('Dispute Info:', disputeInfo);
}

// ============================================
// EMERGENCY & SYSTEM EXAMPLES
// ============================================

async function systemExamples() {
  console.log('\n=== System Operations ===\n');

  const registryAddress = MODULE_ADDRESS;

  // 1. Check if system is paused
  console.log('1. Checking system status...');
  const isPaused = await sdk.isSystemPaused(registryAddress);
  console.log(`System paused: ${isPaused}`);

  // 2. Get pause level
  const pauseLevel = await sdk.getPauseLevel(registryAddress);
  console.log(`Pause level: ${pauseLevel}\n`);

  // 3. Check admin status
  console.log('2. Checking admin status...');
  const isAdmin = await sdk.isAdmin(sdk.getAccountAddress()!, registryAddress);
  console.log(`Is admin: ${isAdmin}`);
}

// ============================================
// CAMPAIGN & REWARDS EXAMPLES
// ============================================

async function rewardsExamples() {
  console.log('\n=== Rewards Operations ===\n');

  const registryAddress = MODULE_ADDRESS;
  const campaignAddress = '0xCAMPAIGN_ADDRESS';

  // 1. Register for campaign
  console.log('1. Registering for campaign...');
  const registerTx = await sdk.registerForCampaign(campaignAddress, registryAddress);
  console.log(`Registered: ${registerTx.hash}\n`);

  // 2. Get campaign info
  console.log('2. Getting campaign info...');
  const campaignInfo = await sdk.getCampaignInfo(campaignAddress);
  console.log('Campaign Info:', {
    name: campaignInfo.name,
    status: campaignInfo.status,
    totalBudget: campaignInfo.totalBudget.toString(),
    participants: campaignInfo.totalParticipants,
  });

  // 3. Claim rewards
  console.log('\n3. Claiming rewards...');
  const claimTx = await sdk.claimRewards(campaignAddress, registryAddress);
  console.log(`Rewards claimed: ${claimTx.hash}\n`);

  // 4. Get rewards summary
  console.log('4. Getting rewards summary...');
  const rewardsSummary = await sdk.getEmployeeRewardsSummary(sdk.getAccountAddress()!);
  console.log('Rewards Summary:', {
    totalEarned: rewardsSummary.totalPatEarned.toString(),
    totalClaimed: rewardsSummary.totalPatClaimed.toString(),
    pending: rewardsSummary.pendingPat.toString(),
    streak: rewardsSummary.currentStreak,
    score: rewardsSummary.engagementScore,
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format token amount for display (assuming 6 decimals)
 */
function formatAmount(amount: bigint, decimals: number = 6): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`;
}

/**
 * Parse token amount from string
 */
function parseAmount(amount: string, decimals: number = 6): bigint {
  const [integer, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedFraction);
}

/**
 * Calculate monthly wage from per-second rate
 */
function calculateMonthlyWage(ratePerSecond: bigint): bigint {
  const secondsPerMonth = BigInt(30 * 24 * 60 * 60);
  return ratePerSecond * secondsPerMonth;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  try {
    console.log('Daily Wage Protocol SDK Examples\n');
    console.log(`Module Address: ${MODULE_ADDRESS}`);
    console.log(`Account: ${sdk.getAccountAddress()}\n`);

    // Run examples (uncomment as needed)
    // await employerExamples();
    // await employeeExamples();
    // await complianceExamples();
    // await disputeExamples();
    // await systemExamples();
    // await rewardsExamples();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();
