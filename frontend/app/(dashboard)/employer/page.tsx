"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Users, Activity, TrendingUp, Wallet, Plus, FileText, ShieldCheck, MoreHorizontal, ArrowUpRight, ArrowDownRight, Zap, Crown, BarChart3, Clock, Sparkles, ChevronRight, Loader2, AlertCircle, RefreshCw, ExternalLink, Pause, Play, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AptosWalletContext";
import { 
  useTreasuryBalance, 
  useTreasuryExists, 
  useTreasuryHealth,
  useTreasuryOperations 
} from "@/hooks/useTreasury";
import { 
  useEmployerStreams, 
  useRegistryStats,
  useWageStreamingEmployer 
} from "@/hooks/useWageStreaming";
import { formatAmount, formatAddress, formatTimeAgo, STREAM_STATUS_MAP, getActualAmount, STREAM_PRECISION } from "@/types";
import { getExplorerUrl } from "@/lib/aptos/config";

// Create Stream Modal Component
const CreateStreamModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: { employee: string; amount: string; days: number; description: string }) => void;
  loading: boolean;
}) => {
  const [employee, setEmployee] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState(30);
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ employee, amount, days, description });
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
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6">Create Wage Stream</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-2">Employee Address</label>
            <input
              type="text"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-xl border border-[#E8DED4] focus:border-[#E85A4F] focus:ring-1 focus:ring-[#E85A4F] outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-2">Total Amount (APT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl border border-[#E8DED4] focus:border-[#E85A4F] focus:ring-1 focus:ring-[#E85A4F] outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-2">Duration (Days)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={1}
              max={365}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DED4] focus:border-[#E85A4F] focus:ring-1 focus:ring-[#E85A4F] outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-2">Job Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Software Developer"
              className="w-full px-4 py-3 rounded-xl border border-[#E8DED4] focus:border-[#E85A4F] focus:ring-1 focus:ring-[#E85A4F] outline-none transition-all"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Stream
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function EmployerDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Blockchain data hooks
  const { exists: treasuryExists, loading: treasuryExistsLoading } = useTreasuryExists();
  const { 
    balanceInApt, 
    availableBalance,
    loading: balanceLoading,
    refetch: refetchBalance 
  } = useTreasuryBalance();
  const { healthPercentage } = useTreasuryHealth();
  const { streams, loading: streamsLoading, refetch: refetchStreams } = useEmployerStreams();
  const { stats: registryStats, loading: statsLoading } = useRegistryStats();
  const { createStream, pauseStream, resumeStream, terminateStream, loading: streamOpLoading } = useWageStreamingEmployer();
  const { initializeTreasury, loading: treasuryOpLoading } = useTreasuryOperations();
  
  // Calculate stats from real data
  const dashboardStats = useMemo(() => {
    const activeStreams = streams.filter(s => s.status === 1).length;
    const totalStreams = streams.length;
    // Use getActualAmount for correct monthly burn calculation
    const monthlyBurn = streams.reduce((acc, s) => {
      if (s.status === 1) {
        return acc + getActualAmount(s.ratePerSecond, BigInt(30 * 24 * 60 * 60));
      }
      return acc;
    }, BigInt(0));

    return [
      { 
        label: "Total Employees", 
        value: totalStreams.toString(), 
        trend: totalStreams > 0 ? `${activeStreams} active` : "No streams",
        icon: Users, 
        iconGradient: "from-[#E85A4F] to-[#F2B5D4]",
        isPositive: activeStreams > 0
      },
      { 
        label: "Active Streams", 
        value: activeStreams.toString(), 
        trend: totalStreams > 0 ? `${Math.round((activeStreams/totalStreams)*100)}%` : "0%",
        icon: Activity, 
        iconGradient: "from-[#F4A259] to-[#E85A4F]",
        isPositive: activeStreams > 0
      },
      { 
        label: "Monthly Burn", 
        value: `${formatAmount(monthlyBurn)} APT`, 
        trend: "Per month",
        icon: TrendingUp, 
        iconGradient: "from-[#6BB3D9] to-[#2B4570]",
        isPositive: true
      },
      { 
        label: "Treasury", 
        value: `${balanceInApt.toFixed(2)} APT`, 
        trend: healthPercentage > 50 ? "Healthy" : healthPercentage > 20 ? "Warning" : "Low",
        icon: Wallet, 
        iconGradient: "from-[#2D9F6C] to-[#6BB3D9]",
        isPositive: healthPercentage > 50
      },
    ];
  }, [streams, balanceInApt, healthPercentage]);

  // Recent activity from streams
  const recentActivity = useMemo(() => {
    return streams.slice(0, 5).map((stream) => ({
      name: formatAddress(stream.employee),
      fullAddress: stream.employee,
      action: STREAM_STATUS_MAP[stream.status] || "unknown",
      amount: `${formatAmount(getActualAmount(stream.ratePerSecond, BigInt(86400)))} APT/day`,
      time: formatTimeAgo(stream.startTime),
      type: stream.status === 1 ? "active" : stream.status === 2 ? "paused" : "other",
      streamId: Number(stream.streamId),
      status: stream.status,
    }));
  }, [streams]);

  // Handle create stream
  const handleCreateStream = async (data: { employee: string; amount: string; days: number; description: string }) => {
    try {
      const amountInOctas = BigInt(Math.floor(parseFloat(data.amount) * 100_000_000));
      const durationSeconds = data.days * 24 * 60 * 60;
      
      const txHash = await createStream(data.employee, amountInOctas, durationSeconds, data.description);
      
      if (txHash) {
        setShowCreateModal(false);
        refetchStreams();
        refetchBalance();
      }
    } catch (error) {
      console.error("Failed to create stream:", error);
    }
  };

  // Handle stream actions
  const handlePauseStream = async (streamId: number) => {
    const txHash = await pauseStream(streamId);
    if (txHash) refetchStreams();
  };

  const handleResumeStream = async (streamId: number) => {
    const txHash = await resumeStream(streamId);
    if (txHash) refetchStreams();
  };

  const handleTerminateStream = async (streamId: number) => {
    if (confirm("Are you sure you want to terminate this stream?")) {
      const txHash = await terminateStream(streamId);
      if (txHash) refetchStreams();
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

  const isLoading = treasuryExistsLoading || balanceLoading || streamsLoading || statsLoading;

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-[#F4A259] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Wallet Not Connected</h2>
          <p className="text-[#4A5568] mb-4">Please connect your wallet to access the employer dashboard.</p>
        </GlassCard>
      </div>
    );
  }

  // Treasury not initialized state
  if (!treasuryExistsLoading && !treasuryExists) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <Wallet className="w-16 h-16 text-[#E85A4F] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Initialize Your Treasury</h2>
          <p className="text-[#4A5568] mb-6">You need to set up your employer treasury before you can create wage streams.</p>
          <Button 
            onClick={handleInitializeTreasury}
            disabled={treasuryOpLoading}
            className="bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white px-8 py-3"
          >
            {treasuryOpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Initialize Treasury
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 relative">
      {/* Create Stream Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateStreamModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateStream}
            loading={streamOpLoading}
          />
        )}
      </AnimatePresence>

      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 -left-32 w-[500px] h-[500px] rounded-full bg-[#E85A4F]/8 blur-[150px]" />
        <div className="absolute bottom-10 -right-32 w-[400px] h-[400px] rounded-full bg-[#F4A259]/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#6BB3D9]/5 blur-[200px]" />
      </div>

      {/* Header */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-[#E8DED4] shadow-xl shadow-[#2B4570]/5 p-6 md:p-8 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 opacity-30">
            <div className="absolute inset-0 border-2 border-[#E85A4F]/30 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute inset-4 border border-[#F4A259]/30 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#F4A259]/5 via-transparent to-[#E85A4F]/5 rounded-3xl" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2B4570]/10 border border-[#6BB3D9]/30 mb-4">
                <Crown className="w-4 h-4 text-[#F4A259]" />
                <span className="text-sm font-medium text-[#2B4570] font-mono">
                  {formatAddress(address || "")}
                </span>
                <a href={getExplorerUrl(address || "", "account")} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 text-[#718096] hover:text-[#E85A4F]" />
                </a>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-[#1A1A2E] via-[#2B4570] to-[#E85A4F] bg-clip-text text-transparent">
                Employer Command Center
              </h1>
              <p className="text-[#4A5568] text-sm md:text-base flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2D9F6C] animate-pulse" />
                  <span className="font-mono text-[#2D9F6C] font-semibold">
                    {streams.filter(s => s.status === 1).length}
                  </span> active streams
                </span>
                <span className="text-[#718096]">•</span>
                <span className="font-mono text-[#E85A4F] font-semibold">
                  {formatAmount(availableBalance)} APT
                </span> available
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => { refetchBalance(); refetchStreams(); }}
                  className="h-14 w-14 border-[#E8DED4]"
                >
                  <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="h-14 px-8 text-base bg-gradient-to-r from-[#E85A4F] to-[#F4A259] hover:from-[#d64a3f] hover:to-[#e3924a] text-white shadow-lg shadow-[#E85A4F]/25 group relative overflow-hidden border-0"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Plus className="mr-2 h-5 w-5" /> 
                  <span>Add Employee</span>
                  <Sparkles className="ml-2 h-4 w-4 text-white/80" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, type: "spring" }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E8DED4] shadow-lg shadow-[#2B4570]/5 p-5 md:p-6 overflow-hidden h-full group hover:shadow-xl hover:shadow-[#E85A4F]/10 transition-all duration-300">
              <div className="flex justify-between items-start mb-5">
                <div className={`p-3 md:p-4 rounded-2xl bg-gradient-to-br ${stat.iconGradient} shadow-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${
                  stat.isPositive 
                    ? 'bg-[#2D9F6C]/10 text-[#2D9F6C] border border-[#2D9F6C]/20' 
                    : 'bg-[#F4A259]/10 text-[#E85A4F] border border-[#F4A259]/20'
                }`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                  {stat.trend}
                </span>
              </div>
              <div className="text-3xl md:text-4xl font-bold font-mono mb-2 bg-gradient-to-r from-[#1A1A2E] to-[#2B4570] bg-clip-text text-transparent">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}
              </div>
              <div className="text-xs text-[#4A5568] uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E8DED4] shadow-lg shadow-[#2B4570]/5 p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center shadow-lg shadow-[#E85A4F]/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E]">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Fund Treasury", icon: Wallet, gradient: "from-[#E85A4F] to-[#F2B5D4]", onClick: () => router.push("/employer/treasury") },
              { label: "View Employees", icon: Users, gradient: "from-[#F4A259] to-[#E85A4F]", onClick: () => router.push("/employer/employees") },
              { label: "Generate Report", icon: FileText, gradient: "from-[#6BB3D9] to-[#2B4570]", onClick: () => {} },
              { label: "Compliance Check", icon: ShieldCheck, gradient: "from-[#2D9F6C] to-[#6BB3D9]", onClick: () => {} },
            ].map((action, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="outline" 
                  onClick={action.onClick}
                  className="h-24 md:h-28 w-full flex flex-col gap-3 border-[#E8DED4] bg-[#FAF6F1]/50 hover:border-[#E85A4F]/30 hover:bg-white hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} shadow-md`}>
                    <action.icon size={20} className="text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-[#1A1A2E]">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Analytics Placeholder */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E8DED4] shadow-lg shadow-[#2B4570]/5 p-6 min-h-[350px] md:min-h-[420px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6BB3D9] to-[#2B4570] flex items-center justify-center shadow-lg shadow-[#6BB3D9]/20">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A2E]">Wage Outflow Analytics</h3>
                  <p className="text-xs text-[#718096]">Real-time streaming overview</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF6F1] border border-[#E8DED4]">
                <Clock className="w-4 h-4 text-[#F4A259]" />
                <span className="text-sm font-mono text-[#1A1A2E]">Live</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-x-8 bottom-16 top-8">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-[#E8DED4]"
                    style={{ bottom: `${i * 25}%` }}
                  />
                ))}
                
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-full pt-4">
                  {streams.length > 0 ? streams.slice(0, 7).map((stream, i) => {
                    // Get actual daily rate and scale for chart height
                    const dailyRate = Number(getActualAmount(stream.ratePerSecond, BigInt(86400)));
                    const heightPercent = Math.min(90, Math.max(20, dailyRate * 10)); // Scale appropriately
                    return (
                      <motion.div
                        key={i}
                        className="w-8 md:w-12 rounded-t-lg bg-gradient-to-t from-[#E85A4F] to-[#F4A259] relative overflow-hidden shadow-md"
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8, type: "spring" }}
                      />
                    );
                  }) : (
                    <div className="text-center text-[#718096]">
                      <p>No streams yet</p>
                      <p className="text-sm">Create your first employee stream to see analytics</p>
                    </div>
                  )}
                </div>
              </div>

              <motion.div
                className="absolute text-center z-10 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-[#E8DED4]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="text-4xl md:text-5xl font-bold font-mono bg-gradient-to-r from-[#E85A4F] via-[#F4A259] to-[#6BB3D9] bg-clip-text text-transparent">
                  {formatAmount(streams.reduce((acc, s) => s.status === 1 ? acc + getActualAmount(s.ratePerSecond, BigInt(30 * 86400)) : acc, BigInt(0)))} APT
                </div>
                <p className="text-[#718096] text-sm mt-2">Monthly Wage Distribution</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity / Stream List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E8DED4] shadow-lg shadow-[#2B4570]/5 overflow-hidden h-full flex flex-col">
            <div className="p-5 md:p-6 border-b border-[#E8DED4] flex justify-between items-center bg-gradient-to-r from-[#FAF6F1] to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F2B5D4] to-[#E85A4F] flex items-center justify-center shadow-lg shadow-[#F2B5D4]/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A2E]">Employee Streams</h3>
                  <p className="text-xs text-[#718096]">{streams.length} total streams</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { refetchStreams(); }}
              >
                <RefreshCw className={`w-4 h-4 ${streamsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="divide-y divide-[#E8DED4] flex-1 overflow-auto max-h-[400px]">
              {streamsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E85A4F]" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-8 text-center text-[#718096]">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No employees yet</p>
                  <p className="text-sm">Click &quot;Add Employee&quot; to create your first stream</p>
                </div>
              ) : (
                recentActivity.map((item, i) => (
                  <motion.div 
                    key={i} 
                    className="p-4 flex items-center justify-between hover:bg-[#FAF6F1] transition-all cursor-pointer group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold ${
                        item.status === 1 ? 'bg-gradient-to-br from-[#2D9F6C]/15 to-[#2D9F6C]/5 text-[#2D9F6C]' : 
                        item.status === 2 ? 'bg-gradient-to-br from-[#F4A259]/15 to-[#F4A259]/5 text-[#F4A259]' :
                        'bg-gradient-to-br from-[#E85A4F]/15 to-[#E85A4F]/5 text-[#E85A4F]'
                      }`}>
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#1A1A2E] font-mono">{item.name}</div>
                        <div className="text-xs text-[#718096] flex items-center gap-1.5">
                          <span className={
                            item.status === 1 ? 'text-[#2D9F6C]' : 
                            item.status === 2 ? 'text-[#F4A259]' : 'text-[#E85A4F]'
                          }>{item.action}</span>
                          <span className="font-mono font-medium text-[#4A5568]">{item.amount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handlePauseStream(item.streamId)}
                          disabled={streamOpLoading}
                        >
                          <Pause className="w-4 h-4 text-[#F4A259]" />
                        </Button>
                      )}
                      {item.status === 2 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleResumeStream(item.streamId)}
                          disabled={streamOpLoading}
                        >
                          <Play className="w-4 h-4 text-[#2D9F6C]" />
                        </Button>
                      )}
                      {(item.status === 1 || item.status === 2) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleTerminateStream(item.streamId)}
                          disabled={streamOpLoading}
                        >
                          <XCircle className="w-4 h-4 text-[#E85A4F]" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-[#E8DED4] bg-gradient-to-r from-[#FAF6F1] to-transparent">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-[#4A5568] hover:text-[#E85A4F] group"
                onClick={() => router.push("/employer/employees")}
              >
                View All Employees
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
