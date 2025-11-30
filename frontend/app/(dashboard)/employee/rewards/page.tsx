"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Gift, Star, Trophy, Zap, TrendingUp, Clock,
  AlertCircle, Loader2, RefreshCw, Sparkles, Target,
  CheckCircle, Lock, ChevronRight, Coins, Crown
} from "lucide-react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { usePhotonBalance, usePhotonOperations } from "@/hooks/usePhotonRewards";
import { useEmployeeStreams } from "@/hooks/useWageStreaming";
import { formatAmount } from "@/types";
import { GlassCard } from "@/components/shared/GlassCard";

interface Reward {
  id: string;
  title: string;
  description: string;
  amount: bigint;
  type: "photon" | "bonus" | "achievement";
  status: "claimable" | "claimed" | "locked";
  requirement?: string;
  icon: React.ElementType;
}

export default function EmployeeRewardsPage() {
  const { isConnected, address } = useAuth();
  const { balance: photonBalance, loading: balanceLoading, refetch: refetchBalance } = usePhotonBalance();
  const { claimRewards, loading: claimLoading } = usePhotonOperations();
  const { streams } = useEmployeeStreams();
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);

  // Sample rewards (in a real app, these would come from the blockchain)
  const rewards: Reward[] = [
    {
      id: "1",
      title: "Daily Photon Rewards",
      description: "Earn Photon tokens for every day of active streaming",
      amount: BigInt(1000),
      type: "photon" as const,
      status: (streams.length > 0 ? "claimable" : "locked") as "claimable" | "locked",
      requirement: "Have at least one active stream",
      icon: Sparkles,
    },
    {
      id: "2",
      title: "First Stream Bonus",
      description: "Congratulations on your first wage stream!",
      amount: BigInt(500),
      type: "bonus" as const,
      status: (streams.length > 0 ? "claimable" : "locked") as "claimable" | "locked",
      requirement: "Join your first wage stream",
      icon: Star,
    },
    {
      id: "3",
      title: "Loyalty Milestone",
      description: "30 days of continuous streaming",
      amount: BigInt(2000),
      type: "achievement" as const,
      status: "locked" as const,
      requirement: "Stream for 30 consecutive days",
      icon: Trophy,
    },
    {
      id: "4",
      title: "Early Adopter",
      description: "Be among the first users of WAP",
      amount: BigInt(1500),
      type: "bonus" as const,
      status: "claimable" as const,
      requirement: "Join during beta period",
      icon: Crown,
    },
    {
      id: "5",
      title: "Perfect Attendance",
      description: "Complete a full stream without pauses",
      amount: BigInt(3000),
      type: "achievement" as const,
      status: "locked" as const,
      requirement: "Complete a stream without any pauses",
      icon: Target,
    },
  ].map(r => ({
    ...r,
    status: (claimedRewards.includes(r.id) ? "claimed" : r.status) as Reward["status"],
  }));

  const handleClaim = async (rewardId: string) => {
    try {
      await claimRewards();
      setClaimedRewards(prev => [...prev, rewardId]);
      refetchBalance();
    } catch (error) {
      console.error("Failed to claim reward:", error);
    }
  };

  const totalClaimable = rewards
    .filter(r => r.status === "claimable")
    .reduce((acc, r) => acc + r.amount, BigInt(0));

  const loading = balanceLoading;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-wap-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-wap-text-primary mb-2">Wallet Not Connected</h2>
          <p className="text-wap-text-secondary mb-4">Please connect your wallet to view rewards.</p>
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
            Rewards & Achievements
          </h1>
          <p className="text-wap-text-secondary mt-1">Earn Photon tokens and unlock achievements</p>
        </div>

        <Button
          variant="outline"
          className="border-wap-border"
          onClick={() => refetchBalance()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-linear-to-br from-wap-pink via-wap-coral to-wap-gold p-[1px] rounded-2xl"
        >
          <div className="bg-white rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-wap-gold" />
                  <span className="text-sm text-wap-text-secondary">Photon Balance</span>
                </div>
                <div className="text-4xl font-bold font-mono bg-linear-to-r from-wap-coral to-wap-gold bg-clip-text text-transparent">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : formatAmount(photonBalance)}
                </div>
                <p className="text-sm text-wap-text-tertiary mt-2">PHOTON Tokens</p>
              </div>
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-wap-gold/20 to-wap-coral/20 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-wap-gold" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-wap-border p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-wap-green" />
            <span className="text-sm text-wap-text-secondary">Claimable</span>
          </div>
          <div className="text-2xl font-bold font-mono text-wap-green">
            {formatAmount(totalClaimable)}
          </div>
          <p className="text-sm text-wap-text-tertiary mt-2">
            {rewards.filter(r => r.status === "claimable").length} rewards available
          </p>
        </motion.div>
      </div>

      {/* Rewards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-wap-text-primary flex items-center gap-2">
          <Trophy className="w-5 h-5 text-wap-gold" />
          Available Rewards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                reward.status === "locked" ? "border-wap-border opacity-75" :
                reward.status === "claimed" ? "border-wap-green/30" :
                "border-wap-gold/30"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    reward.type === "photon" ? "bg-wap-gold/10" :
                    reward.type === "bonus" ? "bg-wap-coral/10" :
                    "bg-wap-sky/10"
                  }`}>
                    <reward.icon className={`w-6 h-6 ${
                      reward.type === "photon" ? "text-wap-gold" :
                      reward.type === "bonus" ? "text-wap-coral" :
                      "text-wap-sky"
                    }`} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    reward.status === "claimable" ? "bg-wap-green/10 text-wap-green" :
                    reward.status === "claimed" ? "bg-wap-text-tertiary/10 text-wap-text-tertiary" :
                    "bg-wap-border text-wap-text-tertiary"
                  }`}>
                    {reward.status === "claimable" ? "Claimable" :
                     reward.status === "claimed" ? "Claimed" : "Locked"}
                  </span>
                </div>

                <h3 className="font-semibold text-wap-text-primary mb-1">{reward.title}</h3>
                <p className="text-sm text-wap-text-tertiary mb-3">{reward.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-wap-gold" />
                    <span className="font-mono font-bold text-wap-text-primary">
                      {formatAmount(reward.amount)}
                    </span>
                  </div>

                  {reward.status === "claimable" ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(reward.id)}
                      disabled={claimLoading}
                      className="bg-linear-to-r from-wap-coral to-wap-gold text-white"
                    >
                      {claimLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Claim <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  ) : reward.status === "claimed" ? (
                    <div className="flex items-center gap-1 text-wap-green text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Claimed
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-wap-text-tertiary text-sm">
                      <Lock className="w-4 h-4" />
                      Locked
                    </div>
                  )}
                </div>

                {reward.status === "locked" && reward.requirement && (
                  <div className="mt-3 pt-3 border-t border-wap-border">
                    <p className="text-xs text-wap-text-tertiary flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {reward.requirement}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-wap-section rounded-2xl border border-wap-border p-6"
      >
        <h3 className="font-semibold text-wap-text-primary mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-wap-gold" />
          How Photon Rewards Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-wap-coral/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-wap-coral">1</span>
            </div>
            <div>
              <h4 className="font-medium text-wap-text-primary">Stream Wages</h4>
              <p className="text-sm text-wap-text-tertiary">Earn Photon tokens for every active wage stream</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-wap-gold/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-wap-gold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-wap-text-primary">Complete Milestones</h4>
              <p className="text-sm text-wap-text-tertiary">Unlock bonus rewards by reaching milestones</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-wap-green/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-wap-green">3</span>
            </div>
            <div>
              <h4 className="font-medium text-wap-text-primary">Claim & Use</h4>
              <p className="text-sm text-wap-text-tertiary">Claim rewards and use them in the ecosystem</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
