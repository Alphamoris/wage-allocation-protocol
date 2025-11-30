"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight, ArrowUpRight, Calendar, Clock, Filter,
  Download, Search, AlertCircle, Loader2, RefreshCw,
  ChevronDown, ExternalLink, Wallet, TrendingUp, FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { useEmployeeStreams } from "@/hooks/useWageStreaming";
import { formatAmount, formatAddress, STREAM_STATUS_MAP, getActualAmount, STREAM_PRECISION } from "@/types";
import { GlassCard } from "@/components/shared/GlassCard";
import { getExplorerUrl } from "@/lib/aptos/config";

interface Transaction {
  id: string;
  type: "withdrawal" | "deposit" | "reward";
  amount: bigint;
  timestamp: number;
  streamId: string;
  employer: string;
  status: "completed" | "pending" | "failed";
  txHash?: string;
}

export default function EmployeeTransactionsPage() {
  const { isConnected, address } = useAuth();
  const { streams, loading: streamsLoading, refetch } = useEmployeeStreams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "withdrawal" | "deposit" | "reward">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Generate transaction history from streams
  const transactions = useMemo(() => {
    const txList: Transaction[] = [];
    const now = Math.floor(Date.now() / 1000);

    streams.forEach(stream => {
      // Add withdrawals (simulated based on totalWithdrawn)
      if (stream.totalWithdrawn > BigInt(0)) {
        txList.push({
          id: `withdrawal-${stream.streamId}`,
          type: "withdrawal",
          amount: stream.totalWithdrawn,
          timestamp: now - Math.floor(Math.random() * 86400 * 7), // Random time in last week
          streamId: stream.streamId,
          employer: stream.employer,
          status: "completed",
        });
      }

      // Add initial deposit (stream creation)
      txList.push({
        id: `deposit-${stream.streamId}`,
        type: "deposit",
        amount: stream.totalDeposited,
        timestamp: stream.startTime,
        streamId: stream.streamId,
        employer: stream.employer,
        status: "completed",
      });
    });

    // Sort by timestamp descending
    return txList.sort((a, b) => b.timestamp - a.timestamp);
  }, [streams]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesFilter = selectedFilter === "all" || tx.type === selectedFilter;
      const matchesSearch = searchQuery === "" || 
        tx.employer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.streamId.includes(searchQuery);
      return matchesFilter && matchesSearch;
    });
  }, [transactions, selectedFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalWithdrawn = streams.reduce((acc, s) => acc + s.totalWithdrawn, BigInt(0));
    const totalDeposited = streams.reduce((acc, s) => acc + s.totalDeposited, BigInt(0));
    const pendingWithdrawable = streams.reduce((acc, s) => {
      if (s.status !== 1) return acc;
      const now = BigInt(Math.floor(Date.now() / 1000));
      const elapsed = now > BigInt(s.startTime) ? now - BigInt(s.startTime) : BigInt(0);
      const duration = BigInt(s.endTime - s.startTime);
      const effectiveElapsed = elapsed > duration ? duration : elapsed;
      const earned = getActualAmount(s.ratePerSecond, effectiveElapsed);
      return acc + (earned > s.totalWithdrawn ? earned - s.totalWithdrawn : BigInt(0));
    }, BigInt(0));

    return {
      totalWithdrawn,
      totalDeposited,
      pendingWithdrawable,
      transactionCount: transactions.length,
    };
  }, [streams, transactions]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-wap-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-wap-text-primary mb-2">Wallet Not Connected</h2>
          <p className="text-wap-text-secondary mb-4">Please connect your wallet to view transactions.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-wap-text-primary to-wap-navy bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-wap-text-secondary mt-1">View your wage stream history</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-wap-border"
            onClick={() => refetch()}
            disabled={streamsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${streamsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="bg-linear-to-r from-wap-coral to-wap-gold text-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-wap-green/20 to-wap-green/5">
              <ArrowDownRight className="w-5 h-5 text-wap-green" />
            </div>
            <span className="text-sm text-wap-text-secondary">Total Withdrawn</span>
          </div>
          <div className="text-2xl font-bold font-mono text-wap-green">
            {formatAmount(stats.totalWithdrawn)} APT
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-wap-gold/20 to-wap-gold/5">
              <Clock className="w-5 h-5 text-wap-gold" />
            </div>
            <span className="text-sm text-wap-text-secondary">Pending Withdrawable</span>
          </div>
          <div className="text-2xl font-bold font-mono text-wap-gold">
            {formatAmount(stats.pendingWithdrawable)} APT
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-wap-sky/20 to-wap-sky/5">
              <FileText className="w-5 h-5 text-wap-sky" />
            </div>
            <span className="text-sm text-wap-text-secondary">Total Transactions</span>
          </div>
          <div className="text-2xl font-bold font-mono text-wap-text-primary">
            {stats.transactionCount}
          </div>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-wap-text-tertiary" />
          <input
            type="text"
            placeholder="Search by employer or stream ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-wap-border focus:border-wap-coral focus:ring-1 focus:ring-wap-coral outline-none transition-all bg-white"
          />
        </div>

        <div className="relative">
          <Button
            variant="outline"
            className="border-wap-border"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {selectedFilter === "all" ? "All Types" : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-wap-border p-2 z-10 min-w-[150px]"
              >
                {(["all", "withdrawal", "deposit", "reward"] as const).map(filter => (
                  <button
                    key={filter}
                    className={`w-full text-left px-4 py-2 rounded-lg hover:bg-wap-section transition-colors ${
                      selectedFilter === filter ? "bg-wap-section text-wap-coral font-medium" : "text-wap-text-secondary"
                    }`}
                    onClick={() => {
                      setSelectedFilter(filter);
                      setShowFilters(false);
                    }}
                  >
                    {filter === "all" ? "All Types" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Transaction List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-wap-border shadow-sm overflow-hidden"
      >
        {streamsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-wap-coral" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="divide-y divide-wap-border">
            {filteredTransactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="p-4 md:p-5 hover:bg-wap-section/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${
                    tx.type === "withdrawal" ? "bg-wap-green/10" :
                    tx.type === "deposit" ? "bg-wap-sky/10" :
                    "bg-wap-gold/10"
                  }`}>
                    {tx.type === "withdrawal" ? (
                      <ArrowDownRight className="w-5 h-5 text-wap-green" />
                    ) : tx.type === "deposit" ? (
                      <ArrowUpRight className="w-5 h-5 text-wap-sky" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-wap-gold" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-wap-text-primary capitalize">
                        {tx.type === "deposit" ? "Stream Created" : tx.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === "completed" ? "bg-wap-green/10 text-wap-green" :
                        tx.status === "pending" ? "bg-wap-gold/10 text-wap-gold" :
                        "bg-wap-coral/10 text-wap-coral"
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-sm text-wap-text-tertiary mt-1">
                      From: {formatAddress(tx.employer)} • Stream #{tx.streamId}
                    </div>
                  </div>

                  {/* Amount & Time */}
                  <div className="text-right">
                    <div className={`font-mono font-bold ${
                      tx.type === "withdrawal" ? "text-wap-green" : "text-wap-text-primary"
                    }`}>
                      {tx.type === "withdrawal" ? "+" : ""}{formatAmount(tx.amount)} APT
                    </div>
                    <div className="text-xs text-wap-text-tertiary mt-1">
                      {formatDate(tx.timestamp)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-wap-text-tertiary">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No transactions found</p>
            <p className="text-sm mt-1">Transactions will appear here once you have wage streams</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
