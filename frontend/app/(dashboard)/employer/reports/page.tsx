"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  FileText, Download, Calendar, TrendingUp, TrendingDown,
  DollarSign, Users, Clock, BarChart3, PieChart, Activity,
  AlertCircle, Loader2, RefreshCw, Filter, ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { useEmployerStreams } from "@/hooks/useWageStreaming";
import { useTreasuryInfo } from "@/hooks/useTreasury";
import { formatAmount, formatAddress, STREAM_STATUS_MAP, getActualAmount, STREAM_PRECISION } from "@/types";
import { GlassCard } from "@/components/shared/GlassCard";

export default function EmployerReportsPage() {
  const { isConnected, address } = useAuth();
  const { streams, loading: streamsLoading, refetch } = useEmployerStreams();
  const { treasuryInfo, loading: treasuryLoading } = useTreasuryInfo();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [showFilters, setShowFilters] = useState(false);

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const periodSeconds = {
      week: 7 * 24 * 60 * 60,
      month: 30 * 24 * 60 * 60,
      quarter: 90 * 24 * 60 * 60,
      year: 365 * 24 * 60 * 60,
    };
    const periodStart = now - periodSeconds[selectedPeriod];

    const activeStreams = streams.filter(s => s.status === 1);
    const completedStreams = streams.filter(s => s.status === 3);
    const pausedStreams = streams.filter(s => s.status === 2);

    // Calculate total disbursed
    const totalDisbursed = streams.reduce((acc, s) => {
      const elapsed = Math.min(now - s.startTime, s.endTime - s.startTime);
      const effectiveElapsed = Math.max(0, elapsed);
      return acc + getActualAmount(s.ratePerSecond, BigInt(effectiveElapsed));
    }, BigInt(0));

    // Calculate monthly burn rate
    const monthlyBurn = activeStreams.reduce((acc, s) => 
      acc + getActualAmount(s.ratePerSecond, BigInt(30 * 24 * 60 * 60)), BigInt(0)
    );

    // Calculate average stream value
    const avgStreamValue = streams.length > 0
      ? streams.reduce((acc, s) => acc + s.totalDeposited, BigInt(0)) / BigInt(streams.length)
      : BigInt(0);

    // Calculate remaining obligations
    const remainingObligations = activeStreams.reduce((acc, s) => {
      const remaining = s.endTime - now;
      if (remaining > 0) {
        return acc + getActualAmount(s.ratePerSecond, BigInt(remaining));
      }
      return acc;
    }, BigInt(0));

    return {
      totalStreams: streams.length,
      activeStreams: activeStreams.length,
      completedStreams: completedStreams.length,
      pausedStreams: pausedStreams.length,
      totalDisbursed,
      monthlyBurn,
      avgStreamValue,
      remainingObligations,
      uniqueEmployees: new Set(streams.map(s => s.employee)).size,
    };
  }, [streams, selectedPeriod]);

  // Stream distribution by status
  const streamDistribution = useMemo(() => {
    const total = streams.length || 1;
    return [
      { label: "Active", value: streams.filter(s => s.status === 1).length, color: "#2D9F6C", percent: (streams.filter(s => s.status === 1).length / total * 100).toFixed(1) },
      { label: "Paused", value: streams.filter(s => s.status === 2).length, color: "#F4A259", percent: (streams.filter(s => s.status === 2).length / total * 100).toFixed(1) },
      { label: "Completed", value: streams.filter(s => s.status === 3).length, color: "#6BB3D9", percent: (streams.filter(s => s.status === 3).length / total * 100).toFixed(1) },
      { label: "Terminated", value: streams.filter(s => s.status === 4).length, color: "#E85A4F", percent: (streams.filter(s => s.status === 4).length / total * 100).toFixed(1) },
    ].filter(d => d.value > 0);
  }, [streams]);

  const loading = streamsLoading || treasuryLoading;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-wap-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-wap-text-primary mb-2">Wallet Not Connected</h2>
          <p className="text-wap-text-secondary mb-4">Please connect your wallet to view reports.</p>
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
            Reports & Analytics
          </h1>
          <p className="text-wap-text-secondary mt-1">Track your wage streaming performance</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <div className="relative">
            <Button
              variant="outline"
              className="border-wap-border"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-wap-border p-2 z-10"
              >
                {(["week", "month", "quarter", "year"] as const).map(period => (
                  <button
                    key={period}
                    className={`w-full text-left px-4 py-2 rounded-lg hover:bg-wap-section transition-colors ${
                      selectedPeriod === period ? "bg-wap-section text-wap-coral font-medium" : "text-wap-text-secondary"
                    }`}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setShowFilters(false);
                    }}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <Button
            variant="outline"
            className="border-wap-border"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button className="bg-linear-to-r from-wap-coral to-wap-gold text-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-wap-coral" />
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-wap-green/20 to-wap-green/5">
                  <DollarSign className="w-5 h-5 text-wap-green" />
                </div>
                <span className="text-sm text-wap-text-secondary">Total Disbursed</span>
              </div>
              <div className="text-2xl font-bold font-mono text-wap-text-primary">
                {formatAmount(analytics.totalDisbursed)} APT
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-wap-green">
                <TrendingUp className="w-3 h-3" />
                <span>All time</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-wap-coral/20 to-wap-coral/5">
                  <Activity className="w-5 h-5 text-wap-coral" />
                </div>
                <span className="text-sm text-wap-text-secondary">Monthly Burn Rate</span>
              </div>
              <div className="text-2xl font-bold font-mono text-wap-text-primary">
                {formatAmount(analytics.monthlyBurn)} APT
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-wap-text-tertiary">
                <Clock className="w-3 h-3" />
                <span>Per month</span>
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
                  <Users className="w-5 h-5 text-wap-sky" />
                </div>
                <span className="text-sm text-wap-text-secondary">Active Employees</span>
              </div>
              <div className="text-2xl font-bold font-mono text-wap-text-primary">
                {analytics.uniqueEmployees}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-wap-text-tertiary">
                <span>{analytics.activeStreams} active streams</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-wap-gold/20 to-wap-gold/5">
                  <BarChart3 className="w-5 h-5 text-wap-gold" />
                </div>
                <span className="text-sm text-wap-text-secondary">Avg Stream Value</span>
              </div>
              <div className="text-2xl font-bold font-mono text-wap-text-primary">
                {formatAmount(analytics.avgStreamValue)} APT
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-wap-text-tertiary">
                <span>Per stream</span>
              </div>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stream Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-wap-border p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-wap-section">
                    <PieChart className="w-5 h-5 text-wap-coral" />
                  </div>
                  <h3 className="text-lg font-semibold text-wap-text-primary">Stream Distribution</h3>
                </div>
              </div>

              {streams.length > 0 ? (
                <div className="space-y-4">
                  {streamDistribution.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="flex-1 text-wap-text-secondary">{item.label}</span>
                      <span className="font-mono font-medium text-wap-text-primary">{item.value}</span>
                      <span className="text-sm text-wap-text-tertiary w-16 text-right">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-wap-text-tertiary">
                  <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No streams to display</p>
                </div>
              )}
            </motion.div>

            {/* Obligations Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl border border-wap-border p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-wap-section">
                    <TrendingUp className="w-5 h-5 text-wap-green" />
                  </div>
                  <h3 className="text-lg font-semibold text-wap-text-primary">Financial Overview</h3>
                </div>
              </div>

              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-wap-section">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-wap-text-secondary">Treasury Balance</span>
                    <span className="font-mono font-bold text-wap-text-primary">
                      {treasuryInfo ? formatAmount(treasuryInfo.balance) : "0.00"} APT
                    </span>
                  </div>
                  <div className="h-2 bg-wap-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-wap-green to-wap-sky rounded-full"
                      style={{ 
                        width: treasuryInfo && analytics.remainingObligations > 0
                          ? `${Math.min(100, Number(treasuryInfo.balance * BigInt(100) / (analytics.remainingObligations || BigInt(1))))}%`
                          : "100%"
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-wap-section">
                    <span className="text-xs text-wap-text-tertiary uppercase tracking-wide">Remaining Obligations</span>
                    <div className="text-lg font-bold font-mono text-wap-coral mt-1">
                      {formatAmount(analytics.remainingObligations)} APT
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-wap-section">
                    <span className="text-xs text-wap-text-tertiary uppercase tracking-wide">Completed Streams</span>
                    <div className="text-lg font-bold font-mono text-wap-green mt-1">
                      {analytics.completedStreams}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl border border-wap-border shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-wap-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-wap-section">
                  <FileText className="w-5 h-5 text-wap-navy" />
                </div>
                <h3 className="text-lg font-semibold text-wap-text-primary">Stream Summary</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-wap-section">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-wap-text-tertiary uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-wap-text-tertiary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-wap-text-tertiary uppercase tracking-wider">Daily Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-wap-text-tertiary uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-wap-text-tertiary uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wap-border">
                  {streams.length > 0 ? streams.slice(0, 10).map((stream, i) => {
                    const now = Math.floor(Date.now() / 1000);
                    const duration = stream.endTime - stream.startTime;
                    const elapsed = Math.min(now - stream.startTime, duration);
                    const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
                    const dailyRate = getActualAmount(stream.ratePerSecond, BigInt(86400));
                    const totalValue = getActualAmount(stream.ratePerSecond, BigInt(duration));

                    return (
                      <tr key={i} className="hover:bg-wap-section/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-wap-text-primary">
                            {formatAddress(stream.employee)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            stream.status === 1 ? "bg-wap-green/10 text-wap-green" :
                            stream.status === 2 ? "bg-wap-gold/10 text-wap-gold" :
                            stream.status === 3 ? "bg-wap-sky/10 text-wap-sky" :
                            "bg-wap-coral/10 text-wap-coral"
                          }`}>
                            {STREAM_STATUS_MAP[stream.status] || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-wap-text-primary">
                          {formatAmount(dailyRate)} APT
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-wap-text-primary">
                          {formatAmount(totalValue)} APT
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-wap-border rounded-full overflow-hidden max-w-[100px]">
                              <div 
                                className="h-full bg-linear-to-r from-wap-coral to-wap-gold rounded-full"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              />
                            </div>
                            <span className="text-xs text-wap-text-tertiary w-12">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-wap-text-tertiary">
                        No streams to display
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
