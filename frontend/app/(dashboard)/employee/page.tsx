"use client";

import React, { useMemo, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { WageCounter } from "@/components/shared/WageCounter";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, Calendar, Gift, Wallet, TrendingUp, ChevronRight, Sparkles, 
  ArrowDownRight, Zap, Target, Shield, Star, Loader2, AlertCircle, RefreshCw, 
  ExternalLink, DollarSign, Clock, Banknote, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AptosWalletContext";
import { 
  useEmployeeStreams, 
  useWageStreamingEmployee 
} from "@/hooks/useWageStreaming";
import { usePhotonBalance, usePhotonOperations } from "@/hooks/usePhotonRewards";
import { formatAmount, formatAddress, STREAM_STATUS_MAP, getStreamProgress, getActualAmount, STREAM_PRECISION } from "@/types";
import { getExplorerUrl } from "@/lib/aptos/config";

// Withdraw Modal Component
const WithdrawModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading,
  maxAmount,
  streamId
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (streamId: number, amount: bigint) => void;
  loading: boolean;
  maxAmount: bigint;
  streamId: number;
}) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInOctas = BigInt(Math.floor(parseFloat(amount) * 100_000_000));
    onSubmit(streamId, amountInOctas);
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
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6">Withdraw Earnings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-[#4A5568]">Amount (APT)</label>
              <button 
                type="button"
                onClick={handleMax}
                className="text-xs text-[#E85A4F] hover:underline"
              >
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
              disabled={loading || !amount}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Withdraw
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function EmployeeDashboard() {
  const { address, isConnected } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState<{ id: number; withdrawable: bigint } | null>(null);
  
  // Blockchain data hooks
  const { streams, loading: streamsLoading, refetch: refetchStreams } = useEmployeeStreams();
  const { withdrawWages, loading: withdrawLoading } = useWageStreamingEmployee();
  const { balance: photonBalance, loading: photonLoading } = usePhotonBalance();
  const { claimRewards, loading: claimLoading } = usePhotonOperations();

  // Calculate stats from real data
  const dashboardStats = useMemo(() => {
    const activeStreams = streams.filter(s => s.status === 1);
    
    // Total earned (withdrawn + withdrawable)
    const totalWithdrawn = streams.reduce((acc, s) => acc + s.totalWithdrawn, BigInt(0));
    const totalWithdrawable = streams.reduce((acc, s) => {
      if (s.status !== 1) return acc;
      const now = BigInt(Math.floor(Date.now() / 1000));
      const startTime = BigInt(s.startTime);
      const endTime = BigInt(s.endTime);
      const elapsed = now > startTime ? now - startTime : BigInt(0);
      const duration = endTime - startTime;
      const effectiveElapsed = elapsed > duration ? duration : elapsed;
      // Apply PRECISION: earned = (ratePerSecond * effectiveElapsed) / PRECISION
      const earned = getActualAmount(s.ratePerSecond, effectiveElapsed);
      return acc + (earned > s.totalWithdrawn ? earned - s.totalWithdrawn : BigInt(0));
    }, BigInt(0));
    
    // Monthly rate calculation with PRECISION
    const monthlyRate = activeStreams.reduce((acc, s) => 
      acc + getActualAmount(s.ratePerSecond, BigInt(30 * 24 * 60 * 60)), BigInt(0)
    );

    // Daily rate with PRECISION
    const dailyRate = activeStreams.reduce((acc, s) => 
      acc + getActualAmount(s.ratePerSecond, BigInt(24 * 60 * 60)), BigInt(0)
    );

    return {
      monthlyEarning: monthlyRate,
      dailyRate: dailyRate,
      totalWithdrawable: totalWithdrawable,
      totalWithdrawn: totalWithdrawn,
      activeStreams: activeStreams.length,
      photonBalance: photonBalance,
    };
  }, [streams, photonBalance]);

  // Handle withdraw
  const handleWithdraw = async (streamId: number, _amount: bigint) => {
    const stream = streams.find(s => Number(s.streamId) === streamId);
    if (!stream) return;
    
    try {
      const txHash = await withdrawWages(streamId);
      if (txHash) {
        setShowWithdrawModal(false);
        setSelectedStream(null);
        refetchStreams();
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  // Handle claim rewards
  const handleClaimRewards = async () => {
    try {
      const txHash = await claimRewards();
      if (txHash) {
        refetchStreams();
      }
    } catch (error) {
      console.error("Claim failed:", error);
    }
  };

  // Open withdraw modal
  const openWithdrawModal = (streamId: number, withdrawable: bigint) => {
    setSelectedStream({ id: streamId, withdrawable });
    setShowWithdrawModal(true);
  };

  const isLoading = streamsLoading;

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-[#F4A259] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Wallet Not Connected</h2>
          <p className="text-[#4A5568] mb-4">Please connect your wallet to access the employee dashboard.</p>
        </GlassCard>
      </div>
    );
  }

  // No streams state
  if (!streamsLoading && streams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <Wallet className="w-16 h-16 text-[#6BB3D9] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">No Active Streams</h2>
          <p className="text-[#4A5568] mb-4">You don&apos;t have any wage streams yet. Ask your employer to create one for you.</p>
          <p className="text-sm text-[#718096] font-mono">{formatAddress(address || "")}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 relative">
      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && selectedStream && (
          <WithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => { setShowWithdrawModal(false); setSelectedStream(null); }}
            onSubmit={handleWithdraw}
            loading={withdrawLoading}
            maxAmount={selectedStream.withdrawable}
            streamId={selectedStream.id}
          />
        )}
      </AnimatePresence>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-[#E85A4F]/5 blur-[120px]" />
        <div className="absolute bottom-20 -left-32 w-96 h-96 rounded-full bg-[#F4A259]/5 blur-[120px]" />
      </div>

      {/* Header */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard variant="meshGradient" className="p-6 md:p-8 overflow-hidden">
          <div className="absolute top-4 right-4 w-20 h-20 opacity-20">
            <div className="absolute inset-0 border-2 border-[#F4A259]/30 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute inset-2 border border-[#E85A4F]/30 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <motion.div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4A259]/10 border border-[#F4A259]/20 mb-3"
                animate={{ 
                  boxShadow: ["0 0 0px rgba(244,162,89,0)", "0 0 20px rgba(244,162,89,0.2)", "0 0 0px rgba(244,162,89,0)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Star className="w-3 h-3 text-[#F4A259] fill-[#F4A259]" />
                <span className="text-xs font-medium text-[#E8A838]">
                  {dashboardStats.activeStreams} Active Stream{dashboardStats.activeStreams !== 1 ? 's' : ''}
                </span>
              </motion.div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#1A1A2E] via-[#E85A4F] to-[#F4A259] bg-clip-text text-transparent">
                  Employee Dashboard
                </h1>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-6 h-6 text-[#F4A259]" />
                </motion.div>
              </div>
              <p className="text-[#4A5568] text-sm md:text-base flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#2D9F6C] animate-pulse" />
                <span className="font-mono text-[#2D9F6C]">{formatAmount(dashboardStats.totalWithdrawable)} APT</span>
                <span>available to withdraw</span>
              </p>
            </div>
            
            {/* Wallet Badge */}
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#E85A4F]/10 to-[#F4A259]/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur-xl rounded-2xl border border-[#E8DED4]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-[#718096]">Connected Wallet</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[#1A1A2E]">{formatAddress(address || "")}</span>
                    <a href={getExplorerUrl(address || "", "account")} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 text-[#718096] hover:text-[#E85A4F]" />
                    </a>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => refetchStreams()}
                  className="ml-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Hero Wage Counter - Using first active stream */}
      {streams.filter(s => s.status === 1).length > 0 && (
        <motion.div 
          className="py-2 md:py-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <WageCounter />
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {[
          { 
            label: "Monthly Rate", 
            value: `${formatAmount(dashboardStats.monthlyEarning)} APT`, 
            subtext: "Based on active streams",
            icon: Calendar, 
            variant: "neonBorder" as const,
            glowColor: "coral" as const,
            iconGradient: "from-[#E85A4F] to-[#F2B5D4]"
          },
          { 
            label: "Daily Rate", 
            value: `${formatAmount(dashboardStats.dailyRate)} APT`, 
            subtext: "Per day earning",
            icon: TrendingUp, 
            variant: "aurora" as const,
            glowColor: "gold" as const,
            iconGradient: "from-[#F4A259] to-[#E85A4F]"
          },
          { 
            label: "Photon Rewards", 
            value: `${formatAmount(dashboardStats.photonBalance)} PAT`, 
            subtext: photonBalance > BigInt(0) ? "Claimable" : "Start earning",
            icon: Gift, 
            variant: "holographic" as const,
            glowColor: "pink" as const,
            iconGradient: "from-[#F2B5D4] to-[#6BB3D9]"
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="perspective-1000"
          >
            <GlassCard variant={stat.variant} glowColor={stat.glowColor} className="relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-current to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
              
              <div className="relative flex items-center gap-4">
                <motion.div 
                  className={`p-4 rounded-2xl bg-gradient-to-br ${stat.iconGradient} shadow-lg`}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon size={24} className="text-white" />
                </motion.div>
                <div className="flex-1">
                  <div className="text-2xl md:text-3xl font-bold font-mono bg-gradient-to-r from-[#1A1A2E] to-[#4A5568] bg-clip-text text-transparent">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}
                  </div>
                  <div className="text-sm text-[#4A5568] font-medium">{stat.label}</div>
                  <div className="text-xs text-[#718096] mt-1">{stat.subtext}</div>
                </div>
                <motion.div
                  className="absolute top-3 right-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 text-[#F4A259]/50" />
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Streams & Transactions */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard variant="meshGradient" className="p-0 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-[#E8DED4]/50 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6BB3D9] to-[#2B4570] flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold">Your Wage Streams</h3>
                  <p className="text-xs text-[#718096]">{streams.length} total streams</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetchStreams()}>
                <RefreshCw className={`w-4 h-4 ${streamsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="divide-y divide-[#E8DED4]/30">
              {streamsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E85A4F]" />
                </div>
              ) : streams.length === 0 ? (
                <div className="p-8 text-center text-[#718096]">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No streams found</p>
                </div>
              ) : (
                streams.map((stream, i) => {
                  const now = BigInt(Math.floor(Date.now() / 1000));
                  const startTime = BigInt(stream.startTime);
                  const endTime = BigInt(stream.endTime);
                  const elapsed = now > startTime ? now - startTime : BigInt(0);
                  const duration = endTime - startTime;
                  const effectiveElapsed = elapsed > duration ? duration : elapsed;
                  // Apply PRECISION to earned calculation
                  const earned = getActualAmount(stream.ratePerSecond, effectiveElapsed);
                  const withdrawable = earned > stream.totalWithdrawn ? earned - stream.totalWithdrawn : BigInt(0);
                  const progress = getStreamProgress(stream);

                  return (
                    <motion.div 
                      key={i} 
                      className="p-4 md:p-5 hover:bg-[#FAF6F1]/50 transition-all duration-300 group"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            stream.status === 1 ? 'bg-gradient-to-br from-[#2D9F6C]/20 to-[#2D9F6C]/5' :
                            stream.status === 2 ? 'bg-gradient-to-br from-[#F4A259]/20 to-[#F4A259]/5' :
                            'bg-gradient-to-br from-[#E85A4F]/20 to-[#E85A4F]/5'
                          }`}>
                            <DollarSign className={`w-6 h-6 ${
                              stream.status === 1 ? 'text-[#2D9F6C]' :
                              stream.status === 2 ? 'text-[#F4A259]' : 'text-[#E85A4F]'
                            }`} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm md:text-base text-[#1A1A2E]">
                              Stream #{Number(stream.streamId)}
                            </div>
                            <div className="text-xs text-[#718096] flex items-center gap-2">
                              <span>From: {formatAddress(stream.employer)}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                stream.status === 1 ? 'bg-[#2D9F6C]/10 text-[#2D9F6C]' : 
                                stream.status === 2 ? 'bg-[#F4A259]/10 text-[#F4A259]' :
                                'bg-[#E85A4F]/10 text-[#E85A4F]'
                              }`}>
                                {STREAM_STATUS_MAP[stream.status]}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold font-mono text-lg text-[#2D9F6C]">
                            {formatAmount(withdrawable)} APT
                          </div>
                          <div className="text-xs text-[#718096]">withdrawable</div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[#718096] mb-1">
                          <span>{formatAmount(getActualAmount(stream.ratePerSecond, BigInt(86400)))} APT/day</span>
                          <span>{progress.toFixed(1)}% complete</span>
                        </div>
                        <div className="h-2 bg-[#E8DED4] rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-[#E85A4F] to-[#F4A259] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      </div>
                      
                      {/* Actions */}
                      {stream.status === 1 && withdrawable > BigInt(0) && (
                        <Button
                          onClick={() => openWithdrawModal(Number(stream.streamId), withdrawable)}
                          disabled={withdrawLoading}
                          className="w-full bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white"
                        >
                          {withdrawLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                          Withdraw {formatAmount(withdrawable)} APT
                        </Button>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {/* Actions Card */}
          <GlassCard variant="orbitalGlow" glowColor="gold" className="relative overflow-hidden">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F4A259] to-[#E85A4F] flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold">Quick Actions</h3>
            </div>
            
            <div className="space-y-3">
              {/* Withdraw All Button - only show if there's withdrawable balance */}
              {streams.some(s => s.status === 1) && (
                <motion.div whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="warm" 
                    className="w-full justify-start h-12 text-base shadow-lg shadow-[#E85A4F]/20"
                    onClick={() => {
                      const activeStream = streams.find(s => s.status === 1);
                      if (activeStream) {
                        const now = BigInt(Math.floor(Date.now() / 1000));
                        const startTime = BigInt(activeStream.startTime);
                        const endTime = BigInt(activeStream.endTime);
                        const elapsed = now > startTime ? now - startTime : BigInt(0);
                        const duration = endTime - startTime;
                        const effectiveElapsed = elapsed > duration ? duration : elapsed;
                        // Apply PRECISION to earned calculation
                        const earned = getActualAmount(activeStream.ratePerSecond, effectiveElapsed);
                        const withdrawable = earned > activeStream.totalWithdrawn ? earned - activeStream.totalWithdrawn : BigInt(0);
                        openWithdrawModal(Number(activeStream.streamId), withdrawable);
                      }
                    }}
                  >
                    <Wallet className="mr-3 h-5 w-5" /> Withdraw Earnings
                  </Button>
                </motion.div>
              )}
              
              <motion.div whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="w-full justify-start h-12 text-base hover:border-[#6BB3D9]/50 hover:bg-[#6BB3D9]/5 group">
                  <TrendingUp className="mr-3 h-5 w-5 text-[#6BB3D9] group-hover:text-[#6BB3D9]" /> View Analytics
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 text-base hover:border-[#F2B5D4]/50 hover:bg-[#F2B5D4]/5 group relative overflow-hidden"
                  onClick={handleClaimRewards}
                  disabled={claimLoading || photonBalance === BigInt(0)}
                >
                  {claimLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Gift className="mr-3 h-5 w-5 text-[#F2B5D4] group-hover:text-[#F2B5D4]" />}
                  Claim Rewards
                  {photonBalance > BigInt(0) && (
                    <motion.span 
                      className="absolute right-3 px-2 py-0.5 rounded-full bg-[#F2B5D4]/20 text-[#E85A4F] text-xs font-bold"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {formatAmount(photonBalance)} PAT
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </div>
          </GlassCard>

          {/* Stream Summary Card */}
          <GlassCard variant="neonBorder" glowColor="gold" className="relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D9F6C] to-[#6BB3D9] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Earnings Summary</h3>
                <p className="text-xs text-[#718096]">All time stats</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-[#FAF6F1] rounded-xl">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-[#2D9F6C]" />
                  <span className="text-sm text-[#4A5568]">Total Withdrawn</span>
                </div>
                <span className="font-mono font-bold text-[#2D9F6C]">{formatAmount(dashboardStats.totalWithdrawn)} APT</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-[#FAF6F1] rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F4A259]" />
                  <span className="text-sm text-[#4A5568]">Pending</span>
                </div>
                <span className="font-mono font-bold text-[#F4A259]">{formatAmount(dashboardStats.totalWithdrawable)} APT</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#E85A4F]/10 to-[#F4A259]/10 rounded-xl border border-[#E85A4F]/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E85A4F]" />
                  <span className="text-sm text-[#4A5568]">Lifetime Earnings</span>
                </div>
                <span className="font-mono font-bold text-[#E85A4F]">
                  {formatAmount(dashboardStats.totalWithdrawn + dashboardStats.totalWithdrawable)} APT
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
