"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Plus,
  Clock,
  Wallet,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Calendar,
  DollarSign,
  RefreshCw,
  Eye,
  Zap,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { useEmployerStreams, useWageStreamingEmployer } from "@/hooks/useWageStreaming";
import { useTreasuryExists } from "@/hooks/useTreasury";
import { formatAmount, formatAddress, formatDate, STREAM_STATUS_MAP, getStreamProgress, getActualAmount, STREAM_PRECISION } from "@/types";
import { getExplorerUrl } from "@/lib/aptos/config";
import { useRouter } from "next/navigation";

// Stream Detail Modal
const StreamDetailModal = ({
  isOpen,
  onClose,
  stream,
  onPause,
  onResume,
  onTerminate,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  stream: {
    streamId: string;
    employee: string;
    employer: string;
    ratePerSecond: bigint;
    totalDeposited: bigint;
    totalWithdrawn: bigint;
    startTime: number;
    endTime: number;
    status: number;
    description?: string;
  } | null;
  onPause: () => void;
  onResume: () => void;
  onTerminate: () => void;
  loading: boolean;
}) => {
  if (!isOpen || !stream) return null;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const startTime = BigInt(stream.startTime);
  const endTime = BigInt(stream.endTime);
  const elapsed = now > startTime ? now - startTime : BigInt(0);
  const duration = endTime - startTime;
  const effectiveElapsed = elapsed > duration ? duration : elapsed;
  // Use getActualAmount to correctly calculate earnings (dividing by PRECISION)
  const earned = getActualAmount(stream.ratePerSecond, effectiveElapsed);
  const withdrawable = earned > stream.totalWithdrawn ? earned - stream.totalWithdrawn : BigInt(0);
  const progress = getStreamProgress(stream);
  const totalAmount = getActualAmount(stream.ratePerSecond, duration);
  const remaining = totalAmount > earned ? totalAmount - earned : BigInt(0);
  // Calculate daily rate properly
  const dailyRate = getActualAmount(stream.ratePerSecond, BigInt(86400));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A2E]">Stream Details</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            stream.status === 1 ? 'bg-[#2D9F6C]/10 text-[#2D9F6C]' :
            stream.status === 2 ? 'bg-[#F4A259]/10 text-[#F4A259]' :
            'bg-[#E85A4F]/10 text-[#E85A4F]'
          }`}>
            {STREAM_STATUS_MAP[stream.status]}
          </span>
        </div>

        <div className="space-y-4">
          {/* Employee Address */}
          <div className="p-4 bg-[#FAF6F1] rounded-xl">
            <label className="text-xs text-[#718096] uppercase tracking-wide">Employee Address</label>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-mono text-[#1A1A2E]">{formatAddress(stream.employee)}</p>
              <a href={getExplorerUrl(stream.employee, "account")} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 text-[#718096] hover:text-[#E85A4F]" />
              </a>
            </div>
          </div>

          {/* Description */}
          {stream.description && (
            <div className="p-4 bg-[#FAF6F1] rounded-xl">
              <label className="text-xs text-[#718096] uppercase tracking-wide">Job Description</label>
              <p className="text-[#1A1A2E] mt-1">{stream.description}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#FAF6F1] rounded-xl">
              <label className="text-xs text-[#718096]">Rate per Day</label>
              <p className="font-mono font-bold text-[#1A1A2E]">{formatAmount(dailyRate)} APT</p>
            </div>
            <div className="p-4 bg-[#FAF6F1] rounded-xl">
              <label className="text-xs text-[#718096]">Total Amount</label>
              <p className="font-mono font-bold text-[#1A1A2E]">{formatAmount(totalAmount)} APT</p>
            </div>
            <div className="p-4 bg-[#FAF6F1] rounded-xl">
              <label className="text-xs text-[#718096]">Already Withdrawn</label>
              <p className="font-mono font-bold text-[#2D9F6C]">{formatAmount(stream.totalWithdrawn)} APT</p>
            </div>
            <div className="p-4 bg-[#FAF6F1] rounded-xl">
              <label className="text-xs text-[#718096]">Pending Withdrawal</label>
              <p className="font-mono font-bold text-[#F4A259]">{formatAmount(withdrawable)} APT</p>
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 bg-[#FAF6F1] rounded-xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#718096]">Stream Progress</span>
              <span className="font-mono font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-[#E8DED4] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E85A4F] to-[#F4A259] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-[#718096]">
              <span>Started: {formatDate(stream.startTime)}</span>
              <span>Ends: {formatDate(stream.endTime)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Close
            </Button>
            {stream.status === 1 && (
              <Button
                onClick={onPause}
                disabled={loading}
                className="flex-1 bg-[#F4A259] hover:bg-[#E8A838] text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                Pause
              </Button>
            )}
            {stream.status === 2 && (
              <Button
                onClick={onResume}
                disabled={loading}
                className="flex-1 bg-[#2D9F6C] hover:bg-[#25855A] text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Resume
              </Button>
            )}
            {(stream.status === 1 || stream.status === 2) && (
              <Button
                onClick={onTerminate}
                disabled={loading}
                variant="outline"
                className="border-[#E85A4F] text-[#E85A4F] hover:bg-[#E85A4F]/10"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function EmployeesPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | "all">("all");
  const [selectedStream, setSelectedStream] = useState<typeof streams[0] | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Blockchain data hooks
  const { exists: treasuryExists, loading: existsLoading } = useTreasuryExists();
  const { streams, loading: streamsLoading, refetch: refetchStreams } = useEmployerStreams();
  const { pauseStream, resumeStream, terminateStream, loading: opLoading } = useWageStreamingEmployer();

  // Filter streams
  const filteredStreams = useMemo(() => {
    return streams.filter(stream => {
      // Search filter - search by employee address
      const matchesSearch = searchQuery === "" || 
        stream.employee.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || stream.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [streams, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = streams.length;
    const active = streams.filter(s => s.status === 1).length;
    const paused = streams.filter(s => s.status === 2).length;
    const completed = streams.filter(s => s.status === 0 || s.status === 3).length;
    // Calculate total value using getActualAmount (rate * duration / PRECISION)
    const totalValue = streams.reduce((acc, s) => {
      const duration = BigInt(s.endTime) - BigInt(s.startTime);
      return acc + getActualAmount(s.ratePerSecond, duration);
    }, BigInt(0));

    return { total, active, paused, completed, totalValue };
  }, [streams]);

  // Handle stream actions
  const handlePauseStream = async () => {
    if (!selectedStream) return;
    const txHash = await pauseStream(Number(selectedStream.streamId));
    if (txHash) {
      refetchStreams();
      setShowDetailModal(false);
      setSelectedStream(null);
    }
  };

  const handleResumeStream = async () => {
    if (!selectedStream) return;
    const txHash = await resumeStream(Number(selectedStream.streamId));
    if (txHash) {
      refetchStreams();
      setShowDetailModal(false);
      setSelectedStream(null);
    }
  };

  const handleTerminateStream = async () => {
    if (!selectedStream) return;
    if (confirm("Are you sure you want to terminate this stream? This action cannot be undone.")) {
      const txHash = await terminateStream(Number(selectedStream.streamId));
      if (txHash) {
        refetchStreams();
        setShowDetailModal(false);
        setSelectedStream(null);
      }
    }
  };

  const openStreamDetail = (stream: typeof streams[0]) => {
    setSelectedStream(stream);
    setShowDetailModal(true);
  };

  const isLoading = existsLoading || streamsLoading;

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-[#F4A259] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Wallet Not Connected</h2>
          <p className="text-[#4A5568] mb-4">Please connect your wallet to manage employees.</p>
        </GlassCard>
      </div>
    );
  }

  // Treasury not initialized
  if (!existsLoading && !treasuryExists) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <Wallet className="w-16 h-16 text-[#E85A4F] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Treasury Required</h2>
          <p className="text-[#4A5568] mb-6">Initialize your treasury to manage employee streams.</p>
          <Button
            onClick={() => router.push("/employer/treasury")}
            className="bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white"
          >
            Go to Treasury
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stream Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedStream && (
          <StreamDetailModal
            isOpen={showDetailModal}
            onClose={() => { setShowDetailModal(false); setSelectedStream(null); }}
            stream={selectedStream}
            onPause={handlePauseStream}
            onResume={handleResumeStream}
            onTerminate={handleTerminateStream}
            loading={opLoading}
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
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E]">Employee Streams</h1>
          <p className="text-[#4A5568] mt-1">Manage wage streams for your employees</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" onClick={() => refetchStreams()} disabled={isLoading}>
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => router.push("/employer")}
            className="bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white"
          >
            <Plus size={18} className="mr-2" />
            Add Employee
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {[
          { label: "Total Employees", value: stats.total, icon: Users, color: "from-[#E85A4F] to-[#F4A259]" },
          { label: "Active Streams", value: stats.active, icon: Zap, color: "from-[#2D9F6C] to-[#34D399]" },
          { label: "Paused", value: stats.paused, icon: Pause, color: "from-[#F4A259] to-[#FCD34D]" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "from-[#6BB3D9] to-[#93C5FD]" },
          { label: "Total Value", value: `${formatAmount(stats.totalValue)} APT`, icon: DollarSign, color: "from-[#E85A4F] to-[#6BB3D9]" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="p-4" variant="default">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#718096]">{stat.label}</p>
                  <p className="text-xl font-bold text-[#1A1A2E] font-mono">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718096]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by address or description..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E8DED4] focus:border-[#E85A4F] focus:ring-1 focus:ring-[#E85A4F] outline-none transition-all bg-white"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: "all" as const, label: "All" },
            { value: 1, label: "Active" },
            { value: 2, label: "Paused" },
            { value: 0, label: "Completed" },
          ].map((filter) => (
            <Button
              key={String(filter.value)}
              variant={statusFilter === filter.value ? "default" : "outline"}
              onClick={() => setStatusFilter(filter.value)}
              className={statusFilter === filter.value 
                ? "bg-[#E85A4F] text-white" 
                : "border-[#E8DED4] text-[#4A5568]"
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Employees List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="overflow-hidden" variant="default">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAF6F1] border-b border-[#E8DED4]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Withdrawn
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DED4]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E85A4F]" />
                    </td>
                  </tr>
                ) : filteredStreams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-[#718096] opacity-50" />
                      <p className="text-[#718096]">
                        {searchQuery || statusFilter !== "all" 
                          ? "No streams match your filters" 
                          : "No employee streams yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStreams.map((stream, index) => {
                    const progress = getStreamProgress(stream);
                    return (
                      <motion.tr
                        key={Number(stream.streamId)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="hover:bg-[#FAF6F1]/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold ${
                              stream.status === 1 ? 'bg-gradient-to-br from-[#2D9F6C] to-[#34D399]' :
                              stream.status === 2 ? 'bg-gradient-to-br from-[#F4A259] to-[#FCD34D]' :
                              'bg-gradient-to-br from-[#718096] to-[#A0AEC0]'
                            }`}>
                              {stream.employee.slice(2, 4).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-mono text-sm font-medium text-[#1A1A2E]">
                                {formatAddress(stream.employee)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-semibold text-[#1A1A2E]">
                            {formatAmount(getActualAmount(stream.ratePerSecond, BigInt(86400)))} APT
                          </p>
                          <p className="text-xs text-[#718096]">per day</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#718096]">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-[#E8DED4] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  stream.status === 1 ? 'bg-gradient-to-r from-[#2D9F6C] to-[#34D399]' :
                                  stream.status === 2 ? 'bg-[#F4A259]' :
                                  'bg-[#718096]'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            stream.status === 1 ? 'bg-[#2D9F6C]/10 text-[#2D9F6C]' :
                            stream.status === 2 ? 'bg-[#F4A259]/10 text-[#F4A259]' :
                            stream.status === 0 ? 'bg-[#6BB3D9]/10 text-[#6BB3D9]' :
                            'bg-[#E85A4F]/10 text-[#E85A4F]'
                          }`}>
                            {stream.status === 1 && <Zap className="w-3 h-3" />}
                            {stream.status === 2 && <Pause className="w-3 h-3" />}
                            {stream.status === 0 && <CheckCircle className="w-3 h-3" />}
                            {stream.status === 3 && <XCircle className="w-3 h-3" />}
                            {STREAM_STATUS_MAP[stream.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-semibold text-[#2D9F6C]">
                            {formatAmount(stream.totalWithdrawn)} APT
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openStreamDetail(stream)}
                              className="h-8 w-8"
                            >
                              <Eye className="w-4 h-4 text-[#718096]" />
                            </Button>
                            {stream.status === 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedStream(stream); handlePauseStream(); }}
                                className="h-8 w-8"
                                disabled={opLoading}
                              >
                                <Pause className="w-4 h-4 text-[#F4A259]" />
                              </Button>
                            )}
                            {stream.status === 2 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedStream(stream); handleResumeStream(); }}
                                className="h-8 w-8"
                                disabled={opLoading}
                              >
                                <Play className="w-4 h-4 text-[#2D9F6C]" />
                              </Button>
                            )}
                            <a
                              href={getExplorerUrl(stream.employee, "account")}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="w-4 h-4 text-[#6BB3D9]" />
                              </Button>
                            </a>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
