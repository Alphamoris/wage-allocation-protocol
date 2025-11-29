# Daily Wage Allocation Protocol

A comprehensive smart contract infrastructure for real-time wage streaming, instant settlements, compliance tracking, and dispute resolution on the Aptos blockchain.

## 🎯 Overview

The Daily Wage Allocation Protocol enables:

- **Real-time Wage Streaming**: Per-second wage accrual with instant withdrawals
- **Employer Treasury Management**: Secure fund pools with reserve requirements
- **Indian Labor Law Compliance**: Automated EPF, ESI, and TDS calculations
- **On-chain Dispute Resolution**: Arbitration system with escrow
- **Gamification & Rewards**: Photon-powered campaign rewards and streaks
- **Emergency Controls**: Circuit breakers and multi-admin governance

## 📁 Project Structure

```
backend/
├── Move.toml                 # Package configuration
├── sources/
│   ├── error_codes.move      # Centralized error codes
│   ├── wage_streaming.move   # Core wage streaming logic
│   ├── employer_treasury.move# Treasury management
│   ├── compliance.move       # EPF/ESI/TDS compliance
│   ├── disputes.move         # Dispute resolution
│   ├── emergency.move        # Emergency controls
│   └── photon_rewards.move   # Campaign rewards
├── tests/
│   ├── wage_streaming_tests.move
│   ├── employer_treasury_tests.move
│   ├── compliance_tests.move
│   ├── disputes_tests.move
│   ├── emergency_tests.move
│   └── photon_rewards_tests.move
├── scripts/
│   ├── deploy_testnet.sh     # Testnet deployment
│   ├── deploy_mainnet.sh     # Mainnet deployment
│   └── Deploy-Testnet.ps1    # PowerShell deployment
├── sdk/
│   ├── src/
│   │   ├── index.ts          # TypeScript SDK
│   │   └── examples.ts       # Usage examples
│   ├── package.json
│   └── tsconfig.json
└── deployments/              # Deployment records
```

## 🚀 Quick Start

### Prerequisites

- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli)
- Move language support (comes with Aptos CLI)
- Node.js 18+ (for SDK)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install Aptos CLI (if not installed)
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

### Compile & Test

```bash
# Compile the Move modules
aptos move compile --named-addresses wage_streaming_addr=0xCAFE

# Run all tests
aptos move test --named-addresses wage_streaming_addr=0xCAFE

# Run tests with coverage
aptos move test --named-addresses wage_streaming_addr=0xCAFE --coverage
```

### Deploy to Testnet

```bash
# Using bash script (Linux/Mac/WSL)
chmod +x scripts/deploy_testnet.sh
./scripts/deploy_testnet.sh

# Using PowerShell (Windows)
.\scripts\Deploy-Testnet.ps1
```

## 📖 Module Documentation

### Wage Streaming (`wage_streaming.move`)

Core module for real-time wage payments:

```move
// Create a new wage stream
public entry fun create_stream(
    employer: &signer,
    employee: address,
    wage_rate_per_second: u64,
    start_time: u64,
    end_time: u64,
    token_metadata: Object<Metadata>,
    initial_deposit: u64,
)

// Withdraw accrued wages
public entry fun withdraw_wages(
    employee: &signer,
    stream_address: address,
)
```

### Employer Treasury (`employer_treasury.move`)

Secure fund management for employers:

```move
// Initialize treasury
public entry fun initialize_treasury(
    employer: &signer,
    reserve_percentage: u64,
    token_metadata: Object<Metadata>,
)

// Deposit funds
public entry fun deposit_funds(
    employer: &signer,
    amount: u64,
    token_metadata: Object<Metadata>,
)
```

### Compliance (`compliance.move`)

Indian statutory compliance (EPF, ESI, TDS):

```move
// Calculate statutory deductions
public fun calculate_total_deductions(
    monthly_gross: u64,
    annual_income: u64,
    registry_address: address,
): (u64, u64, u64, u64) // (epf, esi, tds, total)
```

### Disputes (`disputes.move`)

On-chain arbitration system:

```move
// Create a dispute
public entry fun create_dispute(
    initiator: &signer,
    stream_address: address,
    dispute_type: u8,
    description: String,
    requested_amount: u64,
    registry_address: address,
)
```

### Emergency (`emergency.move`)

Circuit breakers and admin controls:

```move
// Trigger emergency pause
public entry fun trigger_emergency_pause(
    admin: &signer,
    registry_address: address,
    pause_level: u8,
    reason: String,
)
```

### Photon Rewards (`photon_rewards.move`)

Campaign-based rewards and gamification:

```move
// Record daily check-in for streak
public entry fun record_daily_checkin(
    employee: &signer,
)

// Claim rewards from campaign
public entry fun claim_rewards(
    participant: &signer,
    campaign_address: address,
    registry_address: address,
)
```

## 🔧 TypeScript SDK

### Installation

```bash
cd sdk
npm install
npm run build
```

### Usage

```typescript
import { WageProtocolSDK } from '@wage-protocol/sdk';
import { Network } from '@aptos-labs/ts-sdk';

const sdk = new WageProtocolSDK({
  network: Network.TESTNET,
  moduleAddress: '0xYOUR_MODULE_ADDRESS',
  privateKey: process.env.PRIVATE_KEY,
});

// Create a wage stream
await sdk.createWageStream(
  employeeAddress,
  BigInt(1000), // wage per second
  startTime,
  endTime,
  tokenMetadata,
  depositAmount
);

// Withdraw accrued wages
await sdk.withdrawWages(streamAddress);

// Check streak and rewards
const streak = await sdk.getStreakInfo(employeeAddress);
console.log(`Current streak: ${streak.currentStreak} days`);
```

## 📊 Compliance Rates

Default Indian statutory rates:

| Component | Employee Rate | Employer Rate |
|-----------|---------------|---------------|
| EPF       | 12%           | 3.67%         |
| EPS       | -             | 8.33%         |
| ESI       | 0.75%         | 3.25%         |
| TDS       | Per slab      | -             |

ESI is applicable for employees earning ≤ ₹21,000/month.

## ⚠️ Error Codes

| Range | Category |
|-------|----------|
| 1000-1099 | Wage Stream Errors |
| 1100-1199 | Initialization Errors |
| 1200-1299 | Treasury Errors |
| 1300-1399 | Validation Errors |
| 1400-1499 | Access Control Errors |
| 1500-1599 | Compliance Errors |
| 1600-1699 | Dispute Errors |
| 1700-1799 | Emergency Errors |
| 1800-1899 | Rewards Errors |

## 🔐 Security Features

- **Capability-based Access Control**: Role-based permissions
- **Reentrancy Protection**: Secure withdrawal patterns
- **Overflow Prevention**: Safe arithmetic operations
- **Emergency Circuit Breakers**: Multi-level pause system
- **Multi-admin Governance**: Quorum-based critical actions
- **Reserve Requirements**: Liquidity protection

## 🧪 Testing

```bash
# Run all tests
aptos move test --named-addresses wage_streaming_addr=0xCAFE

# Run specific test module
aptos move test --named-addresses wage_streaming_addr=0xCAFE --filter wage_streaming_tests

# Run with verbose output
aptos move test --named-addresses wage_streaming_addr=0xCAFE -v
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions and support, please open an issue on GitHub.
