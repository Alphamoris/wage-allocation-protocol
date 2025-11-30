"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Building, Calendar, Clock, DollarSign,
  AlertCircle, Loader2, RefreshCw, ExternalLink, 
  CheckCircle, Pause, XCircle, TrendingUp, User,
  FileText, MapPin, Mail
} from "lucide-react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { useEmployeeStreams } from "@/hooks/useWageStreaming";
import { formatAmount, formatAddress, STREAM_STATUS_MAP, getActualAmount, STREAM_PRECISION } from "@/types";
import { GlassCard } from "@/components/shared/GlassCard";
import { getExplorerUrl } from "@/lib/aptos/config";

export default function EmployeeEmploymentPage() {
  const { isConnected, address } = useAuth();
  const { streams, loading, refetch } = useEmployeeStreams();

  // Calculate employment stats
  const employmentStats = useMemo(() => {
    const activeStreams = streams.filter(s => s.status === 1);
    const completedStreams = streams.filter(s => s.status === 3);
    const uniqueEmployers = new Set(streams.map(s => s.employer)).size;

    const totalEarned = streams.reduce((acc, s) => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const elapsed = now > BigInt(s.startTime) ? now - BigInt(s.startTime) : BigInt(0);
      const duration = BigInt(s.endTime - s.startTime);
      const effectiveElapsed = elapsed > duration ? duration : elapsed;
      return acc + getActualAmount(s.ratePerSecond, effectiveElapsed);
    }, BigInt(0));

    const averageDaily = activeStreams.reduce((acc, s) => 
      acc + getActualAmount(s.ratePerSecond, BigInt(86400)), BigInt(0)
    );

    return {
      activeStreams: activeStreams.length,
      completedStreams: completedStreams.length,
      totalStreams: streams.length,
      uniqueEmployers,
      totalEarned,
      averageDaily,
    };
  }, [streams]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    if (remaining <= 0) return "Completed";
    const days = Math.floor(remaining / 86400);
    if (days === 0) return "< 1 day";
    return `${days} days`;
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return <CheckCircle className="w-4 h-4 text-wap-green" />;
      case 2: return <Pause className="w-4 h-4 text-wap-gold" />;
      case 3: return <CheckCircle className="w-4 h-4 text-wap-sky" />;
      case 4: return <XCircle className="w-4 h-4 text-wap-coral" />;
      default: return <AlertCircle className="w-4 h-4 text-wap-text-tertiary" />;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-wap-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-wap-text-primary mb-2">Wallet Not Connected</h2>
          <p className="text-wap-text-secondary mb-4">Please connect your wallet to view employment details.</p>
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
            Employment
          </h1>
          <p className="text-wap-text-secondary mt-1">Manage your wage streams and employers</p>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-wap-green" />
            <span className="text-xs text-wap-text-tertiary uppercase tracking-wide">Active</span>
          </div>
          <div className="text-2xl font-bold text-wap-text-primary">
            {employmentStats.activeStreams}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-wap-sky" />
            <span className="text-xs text-wap-text-tertiary uppercase tracking-wide">Employers</span>
          </div>
          <div className="text-2xl font-bold text-wap-text-primary">
            {employmentStats.uniqueEmployers}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-wap-gold" />
            <span className="text-xs text-wap-text-tertiary uppercase tracking-wide">Daily Rate</span>
          </div>
          <div className="text-2xl font-bold font-mono text-wap-text-primary">
            {formatAmount(employmentStats.averageDaily)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-wap-border p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-wap-coral" />
            <span className="text-xs text-wap-text-tertiary uppercase tracking-wide">Total Earned</span>
          </div>
          <div className="text-2xl font-bold font-mono text-wap-green">
            {formatAmount(employmentStats.totalEarned)}
          </div>
        </motion.div>
      </div>

      {/* Employment List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-wap-text-primary flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-wap-coral" />
          Your Wage Streams
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-wap-coral" />
          </div>
        ) : streams.length > 0 ? (
          <div className="space-y-4">
            {streams.map((stream, i) => {
              const now = Math.floor(Date.now() / 1000);
              const duration = stream.endTime - stream.startTime;
              const elapsed = Math.min(now - stream.startTime, duration);
              const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
              const dailyRate = getActualAmount(stream.ratePerSecond, BigInt(86400));
              const totalValue = getActualAmount(stream.ratePerSecond, BigInt(duration));

              return (
                <motion.div
                  key={stream.streamId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="bg-white rounded-2xl border border-wap-border shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${
                          stream.status === 1 ? "bg-wap-green/10" :
                          stream.status === 2 ? "bg-wap-gold/10" :
                          stream.status === 3 ? "bg-wap-sky/10" :
                          "bg-wap-coral/10"
                        }`}>
                          <Building className={`w-6 h-6 ${
                            stream.status === 1 ? "text-wap-green" :
                            stream.status === 2 ? "text-wap-gold" :
                            stream.status === 3 ? "text-wap-sky" :
                            "text-wap-coral"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-wap-text-primary">
                              Stream #{stream.streamId}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              stream.status === 1 ? "bg-wap-green/10 text-wap-green" :
                              stream.status === 2 ? "bg-wap-gold/10 text-wap-gold" :
                              stream.status === 3 ? "bg-wap-sky/10 text-wap-sky" :
                              "bg-wap-coral/10 text-wap-coral"
                            }`}>
                              {getStatusIcon(stream.status)}
                              {STREAM_STATUS_MAP[stream.status] || "Unknown"}
                            </span>
                          </div>
                          <p className="text-sm text-wap-text-tertiary mt-1">
                            Employer: {formatAddress(stream.employer)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={getExplorerUrl(stream.employer, "account")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-wap-sky hover:underline text-sm flex items-center gap-1"
                        >
                          View Employer <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Stream Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-wap-section">
                        <div className="flex items-center gap-1 text-xs text-wap-text-tertiary mb-1">
                          <DollarSign className="w-3 h-3" />
                          Daily Rate
                        </div>
                        <div className="font-mono font-semibold text-wap-text-primary">
                          {formatAmount(dailyRate)} APT
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-wap-section">
                        <div className="flex items-center gap-1 text-xs text-wap-text-tertiary mb-1">
                          <Briefcase className="w-3 h-3" />
                          Total Value
                        </div>
                        <div className="font-mono font-semibold text-wap-text-primary">
                          {formatAmount(totalValue)} APT
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-wap-section">
                        <div className="flex items-center gap-1 text-xs text-wap-text-tertiary mb-1">
                          <Calendar className="w-3 h-3" />
                          Start Date
                        </div>
                        <div className="font-semibold text-wap-text-primary">
                          {formatDate(stream.startTime)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-wap-section">
                        <div className="flex items-center gap-1 text-xs text-wap-text-tertiary mb-1">
                          <Clock className="w-3 h-3" />
                          Remaining
                        </div>
                        <div className="font-semibold text-wap-text-primary">
                          {getDaysRemaining(stream.endTime)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-wap-text-tertiary mb-2">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}% complete</span>
                      </div>
                      <div className="h-3 bg-wap-border rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-linear-to-r from-wap-coral to-wap-gold rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, progress)}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-wap-border p-12 text-center"
          >
            <Briefcase className="w-16 h-16 text-wap-text-tertiary mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-wap-text-primary mb-2">No Employment Records</h3>
            <p className="text-wap-text-tertiary mb-4">
              You don&apos;t have any wage streams yet. Ask your employer to create one for you.
            </p>
            <p className="text-sm text-wap-text-tertiary font-mono">
              Your address: {formatAddress(address || "")}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
