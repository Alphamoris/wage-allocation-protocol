"use client";

import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { WageCounter } from "@/components/shared/WageCounter";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Calendar, Gift, Wallet, TrendingUp, ChevronRight, Sparkles, ArrowDownRight, Zap, Target, Shield, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function EmployeeDashboard() {
  const transactions = [
    { type: "withdrawal", desc: "Withdrawal to Bank", time: "Today, 10:30 AM", amount: "-500.00 USDC", status: "Completed" },
    { type: "earning", desc: "Daily Wage Credit", time: "Today, 12:00 AM", amount: "+850.00 USDC", status: "Credited" },
    { type: "reward", desc: "Weekly Bonus", time: "Yesterday", amount: "+150.00 USDC", status: "Credited" },
    { type: "withdrawal", desc: "Withdrawal to Bank", time: "Yesterday", amount: "-1,200.00 USDC", status: "Completed" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-[#E85A4F]/5 blur-[120px]" />
        <div className="absolute bottom-20 -left-32 w-96 h-96 rounded-full bg-[#F4A259]/5 blur-[120px]" />
      </div>

      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard variant="meshGradient" className="p-6 md:p-8 overflow-hidden">
          <div className="absolute top-4 right-4 w-20 h-20 opacity-20">
            <div className="absolute inset-0 border-2 border-[#F4A259]/30 rounded-full orbit-animation-1" />
            <div className="absolute inset-2 border border-[#E85A4F]/30 rounded-full orbit-animation-2" />
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
                <span className="text-xs font-medium text-[#E8A838]">Premium Worker</span>
              </motion.div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#1A1A2E] via-[#E85A4F] to-[#F4A259] bg-clip-text text-transparent">
                  Welcome back, Arjun
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
                Live earnings streaming now
              </p>
            </div>
            
            {/* Wallet Badge - Light Theme */}
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
                  <span className="text-sm font-mono text-[#1A1A2E]">0x1234...5678</span>
                </div>
              </div>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Hero Wage Counter */}
      <motion.div 
        className="py-2 md:py-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <WageCounter />
      </motion.div>

      {/* Spectacular Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {[
          { 
            label: "This Month", 
            value: "24,500 USDC", 
            subtext: "+12% from last month",
            icon: Calendar, 
            variant: "neonBorder" as const,
            glowColor: "coral" as const,
            iconGradient: "from-wap-coral to-wap-pink"
          },
          { 
            label: "Avg. Daily", 
            value: "850 USDC", 
            subtext: "Based on 28 days",
            icon: TrendingUp, 
            variant: "aurora" as const,
            glowColor: "gold" as const,
            iconGradient: "from-wap-gold to-wap-coral"
          },
          { 
            label: "Next Reward", 
            value: "50 PAT", 
            subtext: "Claim in 2 days",
            icon: Gift, 
            variant: "holographic" as const,
            glowColor: "pink" as const,
            iconGradient: "from-wap-pink to-wap-sky"
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
              {/* Animated background pattern */}
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
                  <div className="text-2xl md:text-3xl font-bold font-mono bg-gradient-to-r from-wap-text-primary to-wap-text-secondary bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-wap-text-secondary font-medium">{stat.label}</div>
                  <div className="text-xs text-wap-text-tertiary mt-1">{stat.subtext}</div>
                </div>
                <motion.div
                  className="absolute top-3 right-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 text-wap-gold/50" />
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions - Spectacular Table */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard variant="meshGradient" className="p-0 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-wap-hover/50 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wap-sky to-wap-navy flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold">Recent Transactions</h3>
                  <p className="text-xs text-wap-text-tertiary">Last 7 days activity</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-wap-coral hover:text-wap-coral/80 group">
                View All 
                <motion.span
                  className="ml-1 inline-block"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.span>
              </Button>
            </div>
            <div className="divide-y divide-wap-hover/30">
              {transactions.map((tx, i) => (
                <motion.div 
                  key={i} 
                  className="p-4 md:p-5 flex items-center justify-between hover:bg-wap-hover/20 transition-all duration-300 group cursor-pointer"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden ${
                        tx.type === 'withdrawal' ? 'bg-gradient-to-br from-wap-coral/20 to-wap-coral/5' :
                        tx.type === 'earning' ? 'bg-gradient-to-br from-wap-green/20 to-wap-green/5' :
                        'bg-gradient-to-br from-wap-gold/20 to-wap-gold/5'
                      }`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      {/* Icon glow effect */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        tx.type === 'withdrawal' ? 'bg-wap-coral/10' :
                        tx.type === 'earning' ? 'bg-wap-green/10' :
                        'bg-wap-gold/10'
                      }`} />
                      {tx.type === 'withdrawal' ? <ArrowUpRight size={22} className="text-wap-coral relative z-10" /> :
                       tx.type === 'earning' ? <ArrowDownRight size={22} className="text-wap-green relative z-10" /> :
                       <Gift size={22} className="text-wap-gold relative z-10" />}
                    </motion.div>
                    <div>
                      <div className="font-semibold text-sm md:text-base group-hover:text-wap-text-primary transition-colors">{tx.desc}</div>
                      <div className="text-xs text-wap-text-tertiary flex items-center gap-2 mt-0.5">
                        <span>{tx.time}</span>
                        <span className="w-1 h-1 rounded-full bg-wap-text-tertiary" />
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          tx.status === 'Completed' ? 'bg-wap-green/10 text-wap-green' : 'bg-wap-sky/10 text-wap-sky'
                        }`}>{tx.status}</span>
                      </div>
                    </div>
                  </div>
                  <motion.div 
                    className="text-right"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className={`font-bold font-mono text-base md:text-lg ${
                      tx.amount.startsWith('+') ? 'text-wap-green' : 'text-wap-text-primary'
                    }`}>{tx.amount}</div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions - Spectacular Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {/* Actions Card */}
          <GlassCard variant="orbitalGlow" glowColor="gold" className="relative overflow-hidden">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wap-gold to-wap-coral flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold">Quick Actions</h3>
            </div>
            
            <div className="space-y-3">
              <motion.div whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}>
                <Button variant="warm" className="w-full justify-start h-12 text-base shadow-lg shadow-wap-coral/20">
                  <Wallet className="mr-3 h-5 w-5" /> Withdraw to Bank
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="w-full justify-start h-12 text-base hover:border-wap-sky/50 hover:bg-wap-sky/5 group">
                  <TrendingUp className="mr-3 h-5 w-5 text-wap-sky group-hover:text-wap-sky" /> View Analytics
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="w-full justify-start h-12 text-base hover:border-wap-pink/50 hover:bg-wap-pink/5 group relative overflow-hidden">
                  <Gift className="mr-3 h-5 w-5 text-wap-pink group-hover:text-wap-pink" /> 
                  Claim Rewards
                  <motion.span 
                    className="absolute right-3 px-2 py-0.5 rounded-full bg-wap-pink/20 text-wap-pink text-xs font-bold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    NEW
                  </motion.span>
                </Button>
              </motion.div>
            </div>
          </GlassCard>

          {/* Savings Goal Card */}
          <GlassCard variant="neonBorder" glowColor="gold" className="relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wap-pink to-wap-coral flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Savings Goal</h3>
                <p className="text-xs text-wap-text-tertiary">New Motorcycle Fund</p>
              </div>
            </div>
            
            <div className="relative">
              {/* Circular Progress */}
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  {/* Background circle */}
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-wap-dark-secondary"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={351.86}
                      initial={{ strokeDashoffset: 351.86 }}
                      animate={{ strokeDashoffset: 351.86 * 0.26 }}
                      transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F15B42" />
                        <stop offset="100%" stopColor="#FFD372" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                      className="text-2xl font-bold font-mono bg-gradient-to-r from-wap-coral to-wap-gold bg-clip-text text-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      74%
                    </motion.span>
                    <span className="text-xs text-wap-text-tertiary">complete</span>
                  </div>
                </div>
              </div>
              
              {/* Amount details */}
              <div className="flex justify-between items-center pt-3 border-t border-wap-hover/50">
                <div>
                  <div className="text-xs text-wap-text-tertiary">Current</div>
                  <div className="font-mono font-bold text-wap-green">18,500 USDC</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-wap-text-tertiary">Goal</div>
                  <div className="font-mono font-bold">25,000 USDC</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
