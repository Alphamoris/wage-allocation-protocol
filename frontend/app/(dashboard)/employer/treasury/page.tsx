"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Send,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  Shield,
  Lock,
  Unlock,
  ArrowRight,
  ExternalLink,
  Copy,
  ChevronDown,
  DollarSign,
  PieChart,
  BarChart3,
  CreditCard,
} from "lucide-react";

const treasuryStats = [
  {
    label: "Total Balance",
    value: "124,589 USDC",
    change: "+12.5%",
    isPositive: true,
    icon: Wallet,
    color: "from-[#E85A4F] to-[#F4A259]",
  },
  {
    label: "Active Streams",
    value: "82,450 USDC",
    change: "18 streams",
    isPositive: true,
    icon: Zap,
    color: "from-[#2D9F6C] to-[#34D399]",
  },
  {
    label: "Pending Payouts",
    value: "18,520 USDC",
    change: "5 pending",
    isPositive: false,
    icon: Clock,
    color: "from-[#F4A259] to-[#FCD34D]",
  },
  {
    label: "Reserved Funds",
    value: "23,619 USDC",
    change: "Protected",
    isPositive: true,
    icon: Shield,
    color: "from-[#6BB3D9] to-[#93C5FD]",
  },
];

const recentTransactions = [
  {
    id: 1,
    type: "deposit",
    amount: "50,000 USDC",
    description: "Treasury Deposit",
    status: "completed",
    time: "2 hours ago",
    hash: "0x7a3f...8e2d",
  },
  {
    id: 2,
    type: "stream",
    amount: "4,528 USDC",
    description: "Wage Stream - Priya Sharma",
    status: "streaming",
    time: "Ongoing",
    hash: "0x9b2c...4f1a",
  },
  {
    id: 3,
    type: "stream",
    amount: "3,845 USDC",
    description: "Wage Stream - Arjun Patel",
    status: "streaming",
    time: "Ongoing",
    hash: "0x1d5e...7c3b",
  },
  {
    id: 4,
    type: "withdrawal",
    amount: "12,500 USDC",
    description: "Emergency Fund Transfer",
    status: "completed",
    time: "1 day ago",
    hash: "0x4e8a...2d9f",
  },
  {
    id: 5,
    type: "claim",
    amount: "3,218 USDC",
    description: "Claim by Sneha Reddy",
    status: "completed",
    time: "2 days ago",
    hash: "0x6c4d...8a1e",
  },
];

const fundingSources = [
  {
    id: 1,
    name: "Primary Treasury",
    type: "Aptos Wallet",
    balance: "85,000 USDC",
    address: "0x742d...35e9",
    status: "connected",
  },
  {
    id: 2,
    name: "Backup Reserve",
    type: "Multi-sig Wallet",
    balance: "39,589 USDC",
    address: "0x9f1a...72c4",
    status: "connected",
  },
];

export default function TreasuryPage() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#2D9F6C]/15 text-[#2D9F6C] border-[#2D9F6C]/30";
      case "streaming":
        return "bg-[#6BB3D9]/15 text-[#6BB3D9] border-[#6BB3D9]/30";
      case "pending":
        return "bg-[#F4A259]/15 text-[#E8A838] border-[#F4A259]/30";
      case "failed":
        return "bg-[#E85A4F]/15 text-[#E85A4F] border-[#E85A4F]/30";
      default:
        return "bg-[#718096]/15 text-[#718096] border-[#718096]/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={14} />;
      case "streaming":
        return <Zap size={14} className="animate-pulse" />;
      case "pending":
        return <Clock size={14} />;
      case "failed":
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownRight size={18} className="text-[#2D9F6C]" />;
      case "withdrawal":
        return <ArrowUpRight size={18} className="text-[#E85A4F]" />;
      case "stream":
        return <Zap size={18} className="text-[#6BB3D9]" />;
      case "claim":
        return <Send size={18} className="text-[#F4A259]" />;
      default:
        return <DollarSign size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E]">
                Treasury Management
              </h1>
              <p className="text-[#4A5568] mt-1">
                Manage funds, deposits, and payroll streams
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowWithdrawModal(true)}
                className="border-[#E8DED4] text-[#4A5568] hover:bg-[#F5EDE6]"
              >
                <ArrowUpRight size={18} className="mr-2" />
                Withdraw
              </Button>
              <Button onClick={() => setShowDepositModal(true)}>
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
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
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
                        stat.isPositive
                          ? "bg-[#2D9F6C]/10 text-[#2D9F6C]"
                          : "bg-[#F4A259]/10 text-[#E8A838]"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-sm text-[#4A5568]">{stat.label}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-[#1A1A2E] mt-1">
                    {stat.value}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Transactions Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <GlassCard className="p-6" variant="default">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#1A1A2E]">Recent Transactions</h2>
                  <Button variant="ghost" className="text-[#4A5568] hover:text-[#1A1A2E]">
                    View All
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {recentTransactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#FAF6F1] border border-[#E8DED4]/50 hover:border-[#E8DED4] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A2E]">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#718096]">{tx.time}</span>
                            <span className="text-xs text-[#718096]">•</span>
                            <button className="flex items-center gap-1 text-xs text-[#6BB3D9] hover:text-[#2B4570] transition-colors">
                              {tx.hash}
                              <ExternalLink size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold font-mono ${
                          tx.type === "deposit" ? "text-[#2D9F6C]" : 
                          tx.type === "withdrawal" ? "text-[#E85A4F]" : "text-[#1A1A2E]"
                        }`}>
                          {tx.type === "deposit" ? "+" : tx.type === "withdrawal" ? "-" : ""}
                          {tx.amount}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getStatusColor(tx.status)}`}>
                          {getStatusIcon(tx.status)}
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Right Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Connected Wallets */}
              <GlassCard className="p-6" variant="default">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#1A1A2E]">Funding Sources</h3>
                  <Button variant="ghost" size="sm" className="text-[#6BB3D9]">
                    <Plus size={16} className="mr-1" />
                    Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {fundingSources.map((source) => (
                    <div
                      key={source.id}
                      className="p-4 rounded-xl bg-[#FAF6F1] border border-[#E8DED4]/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center">
                            <Wallet size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A2E] text-sm">{source.name}</p>
                            <p className="text-xs text-[#718096]">{source.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[#2D9F6C]">
                          <div className="w-2 h-2 rounded-full bg-[#2D9F6C] animate-pulse" />
                          <span className="text-xs font-medium">Connected</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8DED4]/50">
                        <span className="text-lg font-bold text-[#1A1A2E]">{source.balance}</span>
                        <button className="flex items-center gap-1 text-xs text-[#718096] hover:text-[#4A5568] transition-colors">
                          {source.address}
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Quick Actions */}
              <GlassCard className="p-6" variant="default">
                <h3 className="font-bold text-[#1A1A2E] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 rounded-xl bg-[#FAF6F1] border border-[#E8DED4]/50 hover:border-[#E85A4F]/30 hover:bg-[#E85A4F]/5 transition-all group">
                    <Send size={20} className="text-[#E85A4F] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium text-[#1A1A2E]">Send</p>
                  </button>
                  <button className="p-4 rounded-xl bg-[#FAF6F1] border border-[#E8DED4]/50 hover:border-[#2D9F6C]/30 hover:bg-[#2D9F6C]/5 transition-all group">
                    <Download size={20} className="text-[#2D9F6C] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium text-[#1A1A2E]">Receive</p>
                  </button>
                  <button className="p-4 rounded-xl bg-[#FAF6F1] border border-[#E8DED4]/50 hover:border-[#6BB3D9]/30 hover:bg-[#6BB3D9]/5 transition-all group">
                    <RefreshCw size={20} className="text-[#6BB3D9] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium text-[#1A1A2E]">Swap</p>
                  </button>
                  <button className="p-4 rounded-xl bg-[#FAF6F1] border border-[#E8DED4]/50 hover:border-[#F4A259]/30 hover:bg-[#F4A259]/5 transition-all group">
                    <Lock size={20} className="text-[#F4A259] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium text-[#1A1A2E]">Lock</p>
                  </button>
                </div>
              </GlassCard>

              {/* Fund Allocation */}
              <GlassCard className="p-6" variant="default">
                <h3 className="font-bold text-[#1A1A2E] mb-4">Fund Allocation</h3>
                <div className="space-y-4">
                  {[
                    { label: "Active Streams", value: 66, color: "bg-[#2D9F6C]" },
                    { label: "Reserved", value: 19, color: "bg-[#6BB3D9]" },
                    { label: "Pending", value: 15, color: "bg-[#F4A259]" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#4A5568]">{item.label}</span>
                        <span className="text-sm font-semibold text-[#1A1A2E]">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-[#F5EDE6] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full rounded-full ${item.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDepositModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#E8DED4]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2D9F6C] to-[#34D399] flex items-center justify-center">
                  <ArrowDownRight size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1A1A2E]">Deposit Funds</h2>
                  <p className="text-sm text-[#718096]">Add funds to your treasury</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">Amount (USDC)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] text-lg font-mono placeholder:text-[#718096] focus:outline-none focus:border-[#2D9F6C]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">From Wallet</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] focus:outline-none focus:border-[#2D9F6C]/50">
                    <option>Primary Treasury (85,000 USDC)</option>
                    <option>Backup Reserve (39,589 USDC)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF6F1] border border-[#E8DED4]/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#718096]">Network Fee</span>
                    <span className="text-[#1A1A2E]">~0.001 APT</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-[#718096]">Estimated Time</span>
                    <span className="text-[#1A1A2E]">~2 seconds</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 border-[#E8DED4] text-[#4A5568]"
                  onClick={() => setShowDepositModal(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-[#2D9F6C] hover:bg-[#238b5a]">
                  <Plus size={18} className="mr-2" />
                  Deposit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#E8DED4]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center">
                  <ArrowUpRight size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1A1A2E]">Withdraw Funds</h2>
                  <p className="text-sm text-[#718096]">Transfer funds from treasury</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">Amount (USDC)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] text-lg font-mono placeholder:text-[#718096] focus:outline-none focus:border-[#E85A4F]/50"
                    />
                  </div>
                  <p className="text-xs text-[#718096] mt-2">Available: 124,589 USDC</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">Destination Wallet</label>
                  <input
                    type="text"
                    placeholder="Enter wallet address"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] placeholder:text-[#718096] focus:outline-none focus:border-[#E85A4F]/50"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#E85A4F]/5 border border-[#E85A4F]/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-[#E85A4F] mt-0.5" />
                    <p className="text-sm text-[#E85A4F]">
                      Make sure to verify the wallet address before withdrawing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 border-[#E8DED4] text-[#4A5568]"
                  onClick={() => setShowWithdrawModal(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1">
                  <ArrowUpRight size={18} className="mr-2" />
                  Withdraw
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
