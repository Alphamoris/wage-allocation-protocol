<p align="center">
  <img src="https://img.shields.io/badge/Aptos-Blockchain-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjRjNi42MjcgMCAxMi01LjM3MyAxMi0xMlMxOC42MjcgMCAxMiAwIDAgNS4zNzMgMCAxMnM1LjM3MyAxMiAxMiAxMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=" alt="Aptos" />
  <img src="https://img.shields.io/badge/Move-Smart%20Contracts-green?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
</p>

<h1 align="center">
  <br>
  💸 Wage Allocation Protocol (WAP)
  <br>
</h1>

<h3 align="center">
  <em>Revolutionary Real-Time Wage Streaming on Aptos Blockchain</em>
</h3>

<p align="center">
  <strong>Stream wages per-second • Instant withdrawals • Sub-$0.001 transaction costs</strong>
</p>

<p align="center">
  <a href="https://wap45.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌐_LIVE_SITE-wap45.vercel.app-E85A4F?style=for-the-badge" alt="Live Site" />
  </a>
  <a href="https://drive.google.com/drive/folders/1AWI3P2HyzIUw-hcNy95Bu_l_mfnMztev" target="_blank">
    <img src="https://img.shields.io/badge/📊_PRESENTATION-Google_Drive-4285F4?style=for-the-badge&logo=googledrive" alt="PPT & Demo" />
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-smart-contracts">Smart Contracts</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-demo">Demo</a>
</p>

---

## 🎯 The Problem We Solve

Traditional payroll systems are **broken**:

| ❌ Traditional Payroll | ✅ WAP Solution |
|------------------------|-----------------|
| Monthly payment cycles | Custom wage streaming(each second, each day, each week(customizable)) |
| 30+ day wait for earnings | Instant access to earned wages |
| High transaction fees | Sub-$0.001 on Aptos |
| Opaque payment tracking | Real-time transparent ledger |
| Manual compliance filing | Automated EPF/ESI/TDS calculations |
| No dispute mechanism | On-chain arbitration system |

---

## ✨ Features

### 🔄 Real-Time Wage Streaming
```
Every second, your wages accrue.
Every second, you can withdraw.
No waiting. No middlemen. Pure financial freedom.
```

<table>
<tr>
<td width="50%">

### 👔 For Employers
- **Treasury Management** - Secure fund pools with health monitoring
- **Multi-Stream Support** - Pay multiple employees simultaneously
- **Compliance Automation** - EPF, ESI, TDS auto-calculated
- **Pause/Resume Controls** - Flexible stream management
- **Real-time Analytics** - Track disbursements live

</td>
<td width="50%">

### 👷 For Employees
- **Live Wage Counter** - Watch earnings tick up in real-time
- **Instant Withdrawals** - Access your money anytime
- **Multiple Income Streams** - Work for multiple employers
- **Photon Rewards** - Earn bonus tokens for milestones
- **Employment History** - On-chain verifiable work records

</td>
</tr>
</table>

### 🛡️ Enterprise-Grade Security

| Feature | Description |
|---------|-------------|
| **Smart Contract Escrow** | Funds locked in auditable contracts |
| **Emergency Circuit Breakers** | Multi-admin pause capabilities |
| **Dispute Resolution** | On-chain arbitration with evidence |
| **Reserve Requirements** | Treasury health enforcement |

### 🎮 Gamification & Rewards

- 🏆 **Photon Tokens** - Earn rewards for streaming milestones
- 🔥 **Streak Bonuses** - Consecutive day multipliers
- 🎯 **Achievements** - Unlock badges for platform engagement
- 👑 **Early Adopter Rewards** - Special bonuses for beta users

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           WAP ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│   │   Next.js   │────▶│   Aptos     │────▶│    Move     │              │
│   │  Frontend   │◀────│    SDK      │◀────│  Contracts  │              │
│   └─────────────┘     └─────────────┘     └─────────────┘              │
│         │                    │                   │                      │
│         ▼                    ▼                   ▼                      │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│   │   Wallet    │     │  Testnet/   │     │   Stream    │              │
│   │   Adapter   │     │   Mainnet   │     │   Escrow    │              │
│   └─────────────┘     └─────────────┘     └─────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Smart Contract Modules

```
backend/sources/
├── wage_streaming.move      # Core streaming engine
├── employer_treasury.move   # Treasury & fund management
├── compliance.move          # EPF/ESI/TDS automation
├── disputes.move            # On-chain arbitration
├── emergency.move           # Circuit breakers
├── photon_rewards.move      # Gamification layer
└── error_codes.move         # Standardized errors
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Aptos CLI** ([Install Guide](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli))
- **Petra Wallet** or compatible Aptos wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/Alphamoris/wage-allocation-protocol.git
cd wage-allocation-protocol

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

### Smart Contract Deployment

```bash
cd backend

# Compile contracts
aptos move compile --named-addresses wage_streaming_addr=<YOUR_ADDRESS>

# Run tests
aptos move test --named-addresses wage_streaming_addr=<YOUR_ADDRESS>

# Deploy to testnet
aptos move publish --named-addresses wage_streaming_addr=<YOUR_ADDRESS> --profile testnet
```

---

## 📜 Smart Contracts

### Core Modules

#### 1️⃣ Wage Streaming (`wage_streaming.move`)
The heart of WAP - enables per-second wage accrual with precision of 10^8.

```move
/// Create a new wage stream
public entry fun create_stream(
    employer: &signer,
    registry_addr: address,
    employee: address,
    total_amount: u64,
    duration_seconds: u64,
    job_description: String,
)

/// Withdraw accrued wages instantly
public entry fun withdraw_wages(
    employee: &signer,
    registry_addr: address,
    stream_id: u64,
)
```

**Key Features:**
- Per-second wage calculation with 8 decimal precision
- Multi-stream support (up to 10 concurrent streams per employee)
- Pause/Resume functionality with accurate time tracking
- Automatic stream completion handling

#### 2️⃣ Employer Treasury (`employer_treasury.move`)
Secure fund management with health monitoring.

```move
/// Initialize employer treasury
public entry fun initialize(employer: &signer, initial_deposit: u64)

/// Deposit funds for streaming
public entry fun deposit(employer: &signer, amount: u64)

/// Withdraw available (non-reserved) funds  
public entry fun withdraw(employer: &signer, amount: u64)
```

**Treasury Health Levels:**
| Status | Health % | Description |
|--------|----------|-------------|
| 🟢 Healthy | > 75% | Optimal operation |
| 🟡 Warning | 50-75% | Monitor recommended |
| 🟠 Critical | 25-50% | Action required |
| 🔴 Frozen | < 25% | Operations paused |

#### 3️⃣ Compliance (`compliance.move`)
Automated Indian statutory compliance.

| Deduction | Rate | Threshold |
|-----------|------|-----------|
| **EPF** | 12% | All employees |
| **ESI** | 0.75% | ≤ ₹21,000/month |
| **TDS** | Slab-based | As per IT slabs |

#### 4️⃣ Disputes (`disputes.move`)
On-chain arbitration system with escrow.

```move
/// Raise a dispute on a stream
public entry fun raise_dispute(
    employee: &signer,
    registry_addr: address,
    stream_id: u64,
    reason: String,
    evidence_hash: String,
)
```

#### 5️⃣ Emergency (`emergency.move`)
Multi-admin emergency controls.

- Protocol-wide pause capability
- Stream-specific interventions
- Multi-signature governance

#### 6️⃣ Photon Rewards (`photon_rewards.move`)
Gamification and engagement layer.

- Daily streaming rewards
- Streak multipliers (up to 5x)
- Achievement milestones
- Campaign-based bonuses

---

## 💻 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Smooth animations |
| **Aptos Wallet Adapter** | Multi-wallet support |

### Smart Contracts
| Technology | Purpose |
|------------|---------|
| **Move Language** | Secure smart contracts |
| **Aptos Framework** | Blockchain infrastructure |
| **Aptos Coin** | Native APT token support |

### Deployment
| Platform | Purpose |
|----------|---------|
| **Vercel** | Frontend hosting |
| **Aptos Testnet** | Contract deployment |

---

## 🎬 Demo

### 📹 Live Demo & Presentation

<p align="center">
  <a href="https://drive.google.com/drive/folders/1AWI3P2HyzIUw-hcNy95Bu_l_mfnMztev" target="_blank">
    <img src="https://img.shields.io/badge/📽️_Watch_Demo-Google_Drive-red?style=for-the-badge&logo=youtube" alt="Demo Video" />
  </a>
</p>

### 🖥️ Screenshots

#### Employer Dashboard
- Real-time stream monitoring
- Treasury health visualization
- Employee management
- Compliance tracking

#### Employee Dashboard  
- Live wage counter (ticks every second!)
- Instant withdrawal interface
- Photon rewards tracking
- Employment history

---

## 📊 Project Structure

```
wage-allocation-protocol/
│
├── 📁 frontend/                 # Next.js Application
│   ├── app/                     # App Router pages
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── employee/        # Employee pages
│   │   │   └── employer/        # Employer pages
│   │   ├── (public)/            # Public landing page
│   │   └── onboarding/          # User onboarding
│   ├── components/              # React components
│   │   ├── shared/              # Shared UI components
│   │   ├── ui/                  # Base UI primitives
│   │   └── wallet/              # Wallet integration
│   ├── contexts/                # React contexts
│   ├── hooks/                   # Custom React hooks
│   ├── lib/aptos/               # Aptos SDK integration
│   └── types/                   # TypeScript definitions
│
├── 📁 backend/                  # Move Smart Contracts
│   ├── sources/                 # Contract source files
│   ├── tests/                   # Contract test files
│   ├── sdk/                     # TypeScript SDK
│   └── build/                   # Compiled bytecode
│
└── 📄 README.md                 # You are here!
```

---

## 🔑 Key Metrics

| Metric | Value |
|--------|-------|
| **Precision** | 10^8 (8 decimal places) |
| **Min Stream Duration** | 1 hour (3,600 seconds) |
| **Max Stream Duration** | 2 years (63,072,000 seconds) |
| **Max Streams/Employee** | 10 concurrent |
| **Protocol Fee** | 0.25% (configurable) |
| **Gas Cost** | < $0.001 per transaction |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

<p align="center">
  <a href="https://wap45.vercel.app">
    <img src="https://img.shields.io/badge/Live_Site-wap45.vercel.app-E85A4F?style=for-the-badge" alt="Live Site" />
  </a>
  <a href="https://drive.google.com/drive/folders/1AWI3P2HyzIUw-hcNy95Bu_l_mfnMztev">
    <img src="https://img.shields.io/badge/PPT_&_Demo-Google_Drive-4285F4?style=for-the-badge&logo=googledrive" alt="Presentation" />
  </a>
  <a href="https://github.com/Alphamoris/wage-allocation-protocol">
    <img src="https://img.shields.io/badge/Source_Code-GitHub-181717?style=for-the-badge&logo=github" alt="GitHub" />
  </a>
</p>

---

<p align="center">
  <strong>Built with 💜 on Aptos</strong>
  <br>
  <em>Revolutionizing how the world gets paid</em>
</p>

<p align="center">
  <sub>© 2025 Wage Allocation Protocol. All rights reserved.</sub>
</p>
