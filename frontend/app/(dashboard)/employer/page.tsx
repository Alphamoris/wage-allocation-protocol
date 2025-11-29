"use client";

import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Users, Activity, TrendingUp, Wallet, Plus, FileText, ShieldCheck, MoreHorizontal, ArrowUpRight, ArrowDownRight, Zap, Crown, BarChart3, Clock, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function EmployerDashboard() {
  const stats = [
    { label: "Total Workforce", value: "1,240", trend: "+12%", icon: Users, variant: "orbitalGlow" as const, glowColor: "coral" as const, iconGradient: "from-wap-coral to-wap-pink" },
    { label: "Active Streams", value: "85%", trend: "+5%", icon: Activity, variant: "aurora" as const, glowColor: "gold" as const, iconGradient: "from-wap-gold to-wap-coral" },
    { label: "Monthly Burn", value: "45.2K USDC", trend: "-2%", icon: TrendingUp, variant: "neonBorder" as const, glowColor: "sky" as const, iconGradient: "from-wap-sky to-wap-navy" },
    { label: "Treasury", value: "125K USDC", trend: "Low", icon: Wallet, variant: "holographic" as const, glowColor: "gold" as const, iconGradient: "from-wap-green to-wap-sky" },
  ];

  const recentActivity = [
    { name: "Priya Sharma", action: "claimed", amount: "2,500 USDC", time: "2 min ago", type: "claim" },
    { name: "Rajesh Kumar", action: "onboarded", amount: "", time: "15 min ago", type: "new" },
    { name: "Anita Desai", action: "claimed", amount: "1,800 USDC", time: "1 hour ago", type: "claim" },
    { name: "Vikram Singh", action: "claimed", amount: "3,200 USDC", time: "2 hours ago", type: "claim" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 relative">
      {/* Ambient Background Effects - Light Theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 -left-32 w-[500px] h-[500px] rounded-full bg-[#E85A4F]/8 blur-[150px]" />
        <div className="absolute bottom-10 -right-32 w-[400px] h-[400px] rounded-full bg-[#F4A259]/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#6BB3D9]/5 blur-[200px]" />
      </div>

      {/* Spectacular Header - Light Theme */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-[#E8DED4] shadow-xl shadow-[#2B4570]/5 p-6 md:p-8 overflow-hidden">
          {/* Decorative orbital rings */}
          <div className="absolute -top-20 -right-20 w-40 h-40 opacity-30">
            <div className="absolute inset-0 border-2 border-[#E85A4F]/30 rounded-full orbit-animation-1" />
            <div className="absolute inset-4 border border-[#F4A259]/30 rounded-full orbit-animation-2" />
            <div className="absolute inset-8 border border-dashed border-[#6BB3D9]/20 rounded-full orbit-animation-1" />
          </div>
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F4A259]/5 via-transparent to-[#E85A4F]/5 rounded-3xl" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2B4570]/10 border border-[#6BB3D9]/30 mb-4"
                animate={{ 
                  boxShadow: ["0 0 0px rgba(107,179,217,0)", "0 0 20px rgba(107,179,217,0.15)", "0 0 0px rgba(107,179,217,0)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Crown className="w-4 h-4 text-[#F4A259]" />
                <span className="text-sm font-medium text-[#2B4570]">Enterprise Plan</span>
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-[#1A1A2E] via-[#2B4570] to-[#E85A4F] bg-clip-text text-transparent">
                Employer Command Center
              </h1>
              <p className="text-[#4A5568] text-sm md:text-base flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2D9F6C] animate-pulse" />
                  <span className="font-mono text-[#2D9F6C] font-semibold">1,052</span> active streams
                </span>
                <span className="text-[#718096]">•</span>
                <span className="font-mono text-[#E85A4F] font-semibold">23K USDC</span> streaming today
              </p>
            </div>
            
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button className="h-14 px-8 text-base bg-gradient-to-r from-[#E85A4F] to-[#F4A259] hover:from-[#d64a3f] hover:to-[#e3924a] text-white shadow-lg shadow-[#E85A4F]/25 group relative overflow-hidden border-0">
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="mr-2 h-5 w-5" /> 
                <span>Add Employee</span>
                <Sparkles className="ml-2 h-4 w-4 text-white/80" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Spectacular Stats Grid - Light Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.1 + index * 0.1, type: "spring" }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="perspective-1000"
          >
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E8DED4] shadow-lg shadow-[#2B4570]/5 p-5 md:p-6 overflow-hidden h-full group hover:shadow-xl hover:shadow-[#E85A4F]/10 transition-all duration-300">
              {/* Animated corner decoration */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <motion.div 
                  className="absolute top-0 right-0 w-32 h-32 -translate-y-1/2 translate-x-1/2 bg-gradient-to-br from-[#F4A259]/10 to-transparent opacity-50 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="flex justify-between items-start mb-5">
                <motion.div 
                  className={`p-3 md:p-4 rounded-2xl bg-gradient-to-br ${stat.iconGradient} shadow-lg`}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon size={24} className="text-white" />
                </motion.div>
                <motion.span 
                  className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${
                    stat.trend.startsWith('+') ? 'bg-[#2D9F6C]/10 text-[#2D9F6C] border border-[#2D9F6C]/20' : 
                    stat.trend === 'Low' ? 'bg-[#F4A259]/10 text-[#E85A4F] border border-[#F4A259]/20' : 
                    'bg-[#E85A4F]/10 text-[#E85A4F] border border-[#E85A4F]/20'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : 
                   stat.trend.startsWith('-') ? <ArrowDownRight className="w-3 h-3" /> : 
                   <Zap className="w-3 h-3" />}
                  {stat.trend}
                </motion.span>
              </div>
              <div className="text-3xl md:text-4xl font-bold font-mono mb-2 bg-gradient-to-r from-[#1A1A2E] to-[#2B4570] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-[#4A5568] uppercase tracking-wider font-medium">{stat.label}</div>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-[#F4A259]/5 to-transparent rounded-2xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions - Light Theme */}
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
              { label: "Fund Treasury", icon: Wallet, color: "coral", gradient: "from-[#E85A4F] to-[#F2B5D4]" },
              { label: "Bulk Upload", icon: Users, color: "gold", gradient: "from-[#F4A259] to-[#E85A4F]" },
              { label: "Generate Report", icon: FileText, color: "sky", gradient: "from-[#6BB3D9] to-[#2B4570]" },
              { label: "Compliance Check", icon: ShieldCheck, color: "green", gradient: "from-[#2D9F6C] to-[#6BB3D9]" },
            ].map((action, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="outline" 
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
        {/* Analytics Placeholder - Light Theme */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E8DED4] shadow-lg shadow-[#2B4570]/5 p-6 min-h-[350px] md:min-h-[420px] flex flex-col overflow-hidden">
            {/* Header */}
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

            {/* Spectacular Chart Placeholder */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* Animated lines to simulate chart */}
              <div className="absolute inset-x-8 bottom-16 top-8">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-[#E8DED4]"
                    style={{ bottom: `${i * 25}%` }}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  />
                ))}
                
                {/* Animated chart bars */}
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-full pt-4">
                  {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                    <motion.div
                      key={i}
                      className="w-8 md:w-12 rounded-t-lg bg-gradient-to-t from-[#E85A4F] to-[#F4A259] relative overflow-hidden shadow-md"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.8, type: "spring" }}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent"
                        animate={{ y: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: i * 0.2 }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Center floating element */}
              <motion.div
                className="absolute text-center z-10 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-[#E8DED4]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
              >
                <div className="text-5xl md:text-6xl font-bold font-mono bg-gradient-to-r from-[#E85A4F] via-[#F4A259] to-[#6BB3D9] bg-clip-text text-transparent">
                  45.2K USDC
                </div>
                <p className="text-[#718096] text-sm mt-2">Monthly Wage Distribution</p>
              </motion.div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-[#E8DED4]">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <span key={i} className="text-xs text-[#718096] font-mono">{day}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity - Light Theme */}
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
                  <h3 className="text-lg font-bold text-[#1A1A2E]">Live Activity</h3>
                  <p className="text-xs text-[#718096]">Real-time updates</p>
                </div>
              </div>
              <motion.button 
                className="text-[#718096] hover:text-[#E85A4F] transition-colors p-2 rounded-lg hover:bg-[#FAF6F1]"
                whileHover={{ rotate: 90 }}
              >
                <MoreHorizontal size={20} />
              </motion.button>
            </div>
            
            <div className="divide-y divide-[#E8DED4] flex-1">
              {recentActivity.map((item, i) => (
                <motion.div 
                  key={i} 
                  className="p-4 flex items-center justify-between hover:bg-[#FAF6F1] transition-all cursor-pointer group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold relative overflow-hidden ${
                        item.type === 'claim' ? 'bg-gradient-to-br from-[#E85A4F]/15 to-[#E85A4F]/5 text-[#E85A4F]' : 'bg-gradient-to-br from-[#2D9F6C]/15 to-[#2D9F6C]/5 text-[#2D9F6C]'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {item.name.charAt(0)}
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      />
                    </motion.div>
                    <div>
                      <div className="font-semibold text-sm text-[#1A1A2E] group-hover:text-[#E85A4F] transition-colors">{item.name}</div>
                      <div className="text-xs text-[#718096] flex items-center gap-1.5">
                        <span className={item.type === 'claim' ? 'text-[#E85A4F]' : 'text-[#2D9F6C]'}>{item.action}</span>
                        {item.amount && <span className="font-mono font-medium text-[#4A5568]">{item.amount}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-[#718096] font-mono">{item.time}</div>
                </motion.div>
              ))}
            </div>
            
            <div className="p-4 border-t border-[#E8DED4] bg-gradient-to-r from-[#FAF6F1] to-transparent">
              <Button variant="ghost" size="sm" className="w-full text-[#4A5568] hover:text-[#E85A4F] group">
                View All Activity
                <motion.span
                  className="ml-2 inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
