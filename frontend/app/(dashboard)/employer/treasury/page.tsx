"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  ExternalLink,
  DollarSign,
  Loader2,
  Activity,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { 
  useTreasuryBalance, 
  useTreasuryExists,
  useTreasuryHealth,
  useTreasuryOperations
} from "@/hooks/useTreasury";
import { useEmployerStreams } from "@/hooks/useWageStreaming";
import { formatAmount, formatAddress, getActualAmount } from "@/types";
import { getExplorerUrl } from "@/lib/aptos/config";

// Deposit Modal Component
const DepositModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: bigint) => void;
  loading: boolean;
}) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInOctas = BigInt(Math.floor(parseFloat(amount) * 100_000_000));
    onSubmit(amountInOctas);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6">Deposit to Treasury</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-2">Amount (APT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              step="0.01"
              min="0.01"
              className="w-full px-4 py-3 rounded-xl border border-[#E8DED4] focus:border-[#E85A4F] focus:ring-1 focus:ring-[#E85A4F] outline-none transition-all"
              required
            />
          </div>
          <div className="bg-[#FAF6F1] rounded-xl p-4">
            <p className="text-sm text-[#718096]">
              Funds will be transferred from your wallet to the treasury contract.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#2D9F6C] to-[#34D399] text-white"
              disabled={loading || !amount}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Deposit
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Withdraw Modal Component
const WithdrawModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  maxAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: bigint) => void;
  loading: boolean;
  maxAmount: bigint;
}) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInOctas = BigInt(Math.floor(parseFloat(amount) * 100_000_000));
    onSubmit(amountInOctas);
  };

  const handleMax = () => {
    setAmount(formatAmount(maxAmount));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6">Withdraw from Treasury</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-[#4A5568]">Amount (APT)</label>
              <button type="button" onClick={handleMax} className="text-xs text-[#E85A4F] hover:underline cursor-pointer">
                Max: {formatAmount(maxAmount)} APT
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              max={Number(formatAmount(maxAmount))}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DED4] focus:border-[#E85A4F] focus:ring-1 focus:ring-[#E85A4F] outline-none transition-all"
              required
            />
          </div>
          <div className="bg-[#FAF6F1] rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#718096]">Available to withdraw</span>
              <span className="font-mono font-semibold text-[#2D9F6C]">{formatAmount(maxAmount)} APT</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white"
              disabled={loading || !amount}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
              Withdraw
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function TreasuryPage() {
  const { address, isConnected } = useAuth();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Blockchain data hooks
  const { exists: treasuryExists, loading: existsLoading } = useTreasuryExists();
  const { 
    balanceInApt, 
    availableBalance,
    reserveBalance, 
    loading: balanceLoading, 
    refetch: refetchBalance 
  } = useTreasuryBalance();
  const { healthPercentage } = useTreasuryHealth();
  const { deposit, withdraw, initializeTreasury, loading: opLoading } = useTreasuryOperations();
  const { streams, loading: streamsLoading } = useEmployerStreams();

  // Derive health status from health percentage
  const healthStatus = useMemo(() => {
    if (healthPercentage >= 75) return "Healthy";
    if (healthPercentage >= 50) return "Good";
    if (healthPercentage >= 25) return "Warning";
    return "Critical";
  }, [healthPercentage]);

  // Calculate stats
  const treasuryStats = useMemo(() => {
    const activeStreams = streams.filter(s => s.status === 1);
    // Apply PRECISION: remaining value = (ratePerSecond * remaining) / PRECISION
    const activeStreamValue = activeStreams.reduce((acc, s) => {
      const endTime = BigInt(s.endTime);
      const now = BigInt(Math.floor(Date.now() / 1000));
      const remaining = endTime > now ? endTime - now : BigInt(0);
      return acc + (remaining > BigInt(0) ? getActualAmount(s.ratePerSecond, remaining) : BigInt(0));
    }, BigInt(0));
    
    // Apply PRECISION: pending claims = (ratePerSecond * elapsed) / PRECISION - withdrawn
    const pendingClaims = activeStreams.reduce((acc, s) => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const startTime = BigInt(s.startTime);
      const endTime = BigInt(s.endTime);
      const elapsed = now > startTime ? now - startTime : BigInt(0);
      const duration = endTime - startTime;
      const effectiveElapsed = elapsed > duration ? duration : elapsed;
      const earned = getActualAmount(s.ratePerSecond, effectiveElapsed);
      return acc + (earned > s.totalWithdrawn ? earned - s.totalWithdrawn : BigInt(0));
    }, BigInt(0));

    return [
      {
        label: "Total Balance",
        value: `${balanceInApt.toFixed(4)} APT`,
        change: healthStatus,
        isPositive: healthPercentage > 50,
        icon: Wallet,
        color: "from-[#E85A4F] to-[#F4A259]",
      },
      {
        label: "Active Streams",
        value: `${formatAmount(activeStreamValue)} APT`,
        change: `${activeStreams.length} streams`,
        isPositive: true,
        icon: Zap,
        color: "from-[#2D9F6C] to-[#34D399]",
      },
      {
        label: "Pending Claims",
        value: `${formatAmount(pendingClaims)} APT`,
        change: `${activeStreams.length} employees`,
        isPositive: false,
        icon: Clock,
        color: "from-[#F4A259] to-[#FCD34D]",
      },
      {
        label: "Available",
        value: `${formatAmount(availableBalance)} APT`,
        change: "Withdrawable",
        isPositive: true,
        icon: Shield,
        color: "from-[#6BB3D9] to-[#93C5FD]",
      },
    ];
  }, [balanceInApt, streams, availableBalance, healthPercentage, healthStatus]);

  // Handle deposit
  const handleDeposit = async (amount: bigint) => {
    try {
      const txHash = await deposit(amount);
      if (txHash) {
        setShowDepositModal(false);
        refetchBalance();
      }
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  // Handle withdraw
  const handleWithdraw = async (amount: bigint) => {
    try {
      const txHash = await withdraw(amount);
      if (txHash) {
        setShowWithdrawModal(false);
        refetchBalance();
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  // Handle initialize treasury
  const handleInitializeTreasury = async () => {
    try {
      const initialDeposit = BigInt(100_000_000); // 1 APT
      await initializeTreasury(initialDeposit);
      refetchBalance();
    } catch (error) {
      console.error("Failed to initialize treasury:", error);
    }
  };

  const isLoading = existsLoading || balanceLoading || streamsLoading;

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-[#F4A259] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Wallet Not Connected</h2>
          <p className="text-[#4A5568] mb-4">Please connect your wallet to manage your treasury.</p>
        </GlassCard>
      </div>
    );
  }

  // Treasury not initialized state
  if (!existsLoading && !treasuryExists) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <Wallet className="w-16 h-16 text-[#E85A4F] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Initialize Your Treasury</h2>
          <p className="text-[#4A5568] mb-6">
            Set up your employer treasury to start managing funds and creating wage streams.
          </p>
          <Button
            onClick={handleInitializeTreasury}
            disabled={opLoading}
            className="bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white px-8 py-3"
          >
            {opLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Initialize Treasury (1 APT)
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <AnimatePresence>
        {showDepositModal && (
          <DepositModal
            isOpen={showDepositModal}
            onClose={() => setShowDepositModal(false)}
            onSubmit={handleDeposit}
            loading={opLoading}
          />
        )}
        {showWithdrawModal && (
          <WithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            onSubmit={handleWithdraw}
            loading={opLoading}
            maxAmount={availableBalance}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E]">Treasury Management</h1>
          <p className="text-[#4A5568] mt-1 flex items-center gap-2">
            <span className="font-mono text-sm">{formatAddress(address || "")}</span>
            <a href={getExplorerUrl(address || "", "account")} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 text-[#718096] hover:text-[#E85A4F]" />
            </a>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" onClick={() => refetchBalance()} disabled={isLoading}>
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowWithdrawModal(true)}
            className="border-[#E8DED4] text-[#4A5568] hover:bg-[#F5EDE6]"
            disabled={availableBalance === BigInt(0)}
          >
            <ArrowUpRight size={18} className="mr-2" />
            Withdraw
          </Button>
          <Button 
            onClick={() => setShowDepositModal(true)}
            className="bg-gradient-to-r from-[#2D9F6C] to-[#34D399] text-white"
          >
            <Plus size={18} className="mr-2" />
            Deposit Funds
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {treasuryStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-5" variant="default">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.isPositive ? "bg-[#2D9F6C]/10 text-[#2D9F6C]" : "bg-[#F4A259]/10 text-[#E8A838]"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-[#4A5568]">{stat.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-[#1A1A2E] mt-1 font-mono">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Treasury Health */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-6" variant="default">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1A1A2E]">Treasury Health</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                healthPercentage > 50 ? 'bg-[#2D9F6C]/10 text-[#2D9F6C]' :
                healthPercentage > 20 ? 'bg-[#F4A259]/10 text-[#F4A259]' :
                'bg-[#E85A4F]/10 text-[#E85A4F]'
              }`}>
                {healthStatus}
              </span>
            </div>

            {/* Health Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#718096]">Fund Coverage</span>
                <span className="font-mono font-semibold">{healthPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-[#E8DED4] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    healthPercentage > 50 ? 'bg-gradient-to-r from-[#2D9F6C] to-[#34D399]' :
                    healthPercentage > 20 ? 'bg-gradient-to-r from-[#F4A259] to-[#FCD34D]' :
                    'bg-gradient-to-r from-[#E85A4F] to-[#F4A259]'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(healthPercentage, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#FAF6F1] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#2D9F6C]" />
                  <span className="text-sm text-[#718096]">Total Balance</span>
                </div>
                <p className="text-xl font-bold font-mono text-[#1A1A2E]">{balanceInApt.toFixed(4)} APT</p>
              </div>
              <div className="p-4 bg-[#FAF6F1] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-[#6BB3D9]" />
                  <span className="text-sm text-[#718096]">Reserve</span>
                </div>
                <p className="text-xl font-bold font-mono text-[#1A1A2E]">{formatAmount(reserveBalance)} APT</p>
              </div>
              <div className="p-4 bg-[#FAF6F1] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-[#F4A259]" />
                  <span className="text-sm text-[#718096]">Available</span>
                </div>
                <p className="text-xl font-bold font-mono text-[#1A1A2E]">{formatAmount(availableBalance)} APT</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-6" variant="default">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">Quick Actions</h2>
            
            <div className="space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setShowDepositModal(true)}
                  className="w-full h-14 justify-start bg-gradient-to-r from-[#2D9F6C] to-[#34D399] text-white"
                >
                  <ArrowDownRight className="w-5 h-5 mr-3" />
                  Deposit Funds
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={availableBalance === BigInt(0)}
                  variant="outline"
                  className="w-full h-14 justify-start border-[#E8DED4] hover:bg-[#F5EDE6]"
                >
                  <ArrowUpRight className="w-5 h-5 mr-3 text-[#E85A4F]" />
                  Withdraw Available
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start border-[#E8DED4] hover:bg-[#F5EDE6]"
                >
                  <PieChart className="w-5 h-5 mr-3 text-[#6BB3D9]" />
                  View Analytics
                </Button>
              </motion.div>
            </div>

            {/* Active Streams Summary */}
            <div className="mt-6 pt-6 border-t border-[#E8DED4]">
              <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4">Active Streams</h3>
              <div className="space-y-3">
                {streams.filter(s => s.status === 1).slice(0, 3).map((stream, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#FAF6F1] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6BB3D9] to-[#2B4570] flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A2E]">{formatAddress(stream.employee)}</p>
                        <p className="text-xs text-[#718096]">{formatAmount(getActualAmount(stream.ratePerSecond, BigInt(86400)))} APT/day</p>
                      </div>
                    </div>
                    <Zap className="w-4 h-4 text-[#2D9F6C] animate-pulse" />
                  </div>
                ))}
                {streams.filter(s => s.status === 1).length === 0 && (
                  <p className="text-sm text-[#718096] text-center py-4">No active streams</p>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
