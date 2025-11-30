"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, User, ArrowRight, Sparkles, Shield, Zap, Crown, Wallet, TrendingUp, Clock, Gift, BarChart3, ArrowLeft, Check, Loader2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUserRole, UserRole } from "@/contexts/AptosWalletContext";

type Step = "role" | "wallet" | "connecting";

export default function OnboardingPage() {
  const router = useRouter();
  const { connected, isLoading, account, connect, wallets } = useWallet();
  const { role, setRole } = useUserRole();
  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [showWalletSelect, setShowWalletSelect] = useState(false);

  const availableWallets = wallets.filter(w => {
    const state = w.readyState as string;
    return state === "Installed" || state === "Loadable";
  });

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setShowWalletSelect(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // When wallet connects, redirect to appropriate dashboard
  useEffect(() => {
    if (connected && selectedRole) {
      setRole(selectedRole);
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        router.push(`/${selectedRole}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [connected, selectedRole, router, setRole]);

  // Handle role selection
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep("wallet");
  };

  // Go back to role selection
  const handleBack = () => {
    setStep("role");
    setSelectedRole(null);
  };

  return (
    <motion.div 
      className="max-w-5xl w-full space-y-10 md:space-y-16 text-center px-4 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating Particles - Light Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              i % 3 === 0 ? 'bg-[#E85A4F]/40' : i % 3 === 1 ? 'bg-[#F4A259]/40' : 'bg-[#6BB3D9]/40'
            }`}
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ============ STEP 1: ROLE SELECTION ============ */}
        {step === "role" && (
          <motion.div
            key="role-step"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="space-y-10 md:space-y-16"
          >
            {/* Header */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <motion.div 
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#F4A259]/15 to-[#E85A4F]/15 border border-[#F4A259]/30 backdrop-blur-sm"
                animate={{ 
                  boxShadow: ["0 0 0px rgba(244,162,89,0)", "0 0 25px rgba(244,162,89,0.2)", "0 0 0px rgba(244,162,89,0)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-[#F4A259]" />
                <span className="text-sm font-medium bg-gradient-to-r from-[#F4A259] to-[#E85A4F] bg-clip-text text-transparent">Step 1 of 2: Choose Your Role</span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight">
                <span className="block text-[#1A1A2E]">Welcome to</span>
                <span className="block mt-2 bg-gradient-to-r from-[#E85A4F] via-[#F4A259] to-[#F2B5D4] bg-clip-text text-transparent">
                  The Future of Work
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-[#4A5568] max-w-2xl mx-auto">
                Choose your path and unlock instant access to earned wages, 
                <span className="text-[#E85A4F] font-medium"> powered by blockchain</span>
              </p>
            </motion.div>

            {/* Role Cards */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-10">
              {/* Employer Card */}
              <motion.div
                initial={{ opacity: 0, x: -50, rotateY: -10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="perspective-1000"
              >
                <button onClick={() => handleRoleSelect("employer")} className="block h-full w-full text-left cursor-pointer">
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-[#E8DED4] shadow-xl shadow-[#E85A4F]/10 h-full p-8 md:p-10 flex flex-col items-center gap-8 group cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-[#E85A4F]/15 transition-all duration-300">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E85A4F] to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    {/* Orbital Icon */}
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 w-28 h-28 md:w-32 md:h-32 border-2 border-dashed border-[#E85A4F]/30 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-2 w-24 h-24 md:w-28 md:h-28 border border-[#F4A259]/30 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div 
                        className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center shadow-2xl shadow-[#E85A4F]/30"
                        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Building2 size={48} className="md:w-14 md:h-14 text-white" />
                      </motion.div>
                      
                      {/* Floating Badge */}
                      <motion.div
                        className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-[#F4A259] text-white text-xs font-bold shadow-lg"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Crown className="w-3 h-3 inline mr-1" />
                        PRO
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 relative z-10 text-center">
                      <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#E85A4F] to-[#F4A259] bg-clip-text text-transparent">
                        I'm an Employer
                      </h2>
                      <p className="text-[#4A5568] text-sm md:text-base max-w-xs">
                        Transform your payroll with automated, instant wage streaming to your workforce.
                      </p>
                      
                      {/* Feature Pills */}
                      <div className="flex flex-wrap justify-center gap-2 pt-3">
                        {[
                          { icon: Wallet, label: "Fund Treasury", color: "#E85A4F" },
                          { icon: BarChart3, label: "Analytics", color: "#F4A259" },
                          { icon: Shield, label: "Compliance", color: "#2D9F6C" },
                        ].map((feat, i) => (
                          <motion.span 
                            key={i}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
                            style={{ 
                              backgroundColor: `${feat.color}10`,
                              color: feat.color,
                              borderColor: `${feat.color}30`
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.1 }}
                          >
                            <feat.icon className="w-3 h-3" />
                            {feat.label}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <motion.div 
                      className="w-full relative"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#E85A4F] to-[#F4A259] rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                      <div className="relative w-full h-14 text-base font-semibold shadow-xl bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white rounded-xl flex items-center justify-center gap-2">
                        Continue as Employer 
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.span>
                      </div>
                    </motion.div>
                  </div>
                </button>
              </motion.div>

              {/* Employee Card */}
              <motion.div
                initial={{ opacity: 0, x: 50, rotateY: 10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="perspective-1000"
              >
                <button onClick={() => handleRoleSelect("employee")} className="block h-full w-full text-left cursor-pointer">
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-[#E8DED4] shadow-xl shadow-[#6BB3D9]/10 h-full p-8 md:p-10 flex flex-col items-center gap-8 group cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-[#6BB3D9]/15 transition-all duration-300">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#6BB3D9] to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    </div>

                    {/* Orbital Icon */}
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 w-28 h-28 md:w-32 md:h-32 border-2 border-dashed border-[#6BB3D9]/30 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-2 w-24 h-24 md:w-28 md:h-28 border border-[#F2B5D4]/30 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div 
                        className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-[#6BB3D9] to-[#2B4570] flex items-center justify-center shadow-2xl shadow-[#6BB3D9]/30"
                        whileHover={{ rotate: [0, 5, -5, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <User size={48} className="md:w-14 md:h-14 text-white" />
                      </motion.div>
                      
                      {/* Floating Badge */}
                      <motion.div
                        className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-[#2D9F6C] text-white text-xs font-bold shadow-lg"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        <Zap className="w-3 h-3 inline mr-1" />
                        FREE
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 relative z-10 text-center">
                      <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#6BB3D9] to-[#F2B5D4] bg-clip-text text-transparent">
                        I'm an Employee
                      </h2>
                      <p className="text-[#4A5568] text-sm md:text-base max-w-xs">
                        Access your earned wages instantly, anytime. Watch your money grow in real-time.
                      </p>
                      
                      {/* Feature Pills */}
                      <div className="flex flex-wrap justify-center gap-2 pt-3">
                        {[
                          { icon: Clock, label: "Instant Access", color: "#6BB3D9" },
                          { icon: Gift, label: "Rewards", color: "#F2B5D4" },
                          { icon: TrendingUp, label: "Zero Fees", color: "#F4A259" },
                        ].map((feat, i) => (
                          <motion.span 
                            key={i}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
                            style={{ 
                              backgroundColor: `${feat.color}15`,
                              color: feat.color,
                              borderColor: `${feat.color}30`
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                          >
                            <feat.icon className="w-3 h-3" />
                            {feat.label}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <motion.div 
                      className="w-full relative"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#6BB3D9] to-[#2B4570] rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                      <div className="relative w-full h-14 text-base font-semibold shadow-xl bg-gradient-to-r from-[#6BB3D9] to-[#2B4570] text-white rounded-xl flex items-center justify-center gap-2">
                        Continue as Employee 
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.span>
                      </div>
                    </motion.div>
                  </div>
                </button>
              </motion.div>
            </div>

            {/* Trust Indicators */}
            <motion.div 
              className="pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-[#E8DED4] shadow-lg py-6 px-8 inline-flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {[
                  { icon: Shield, label: "Bank-Grade Security", color: "#2D9F6C" },
                  { icon: Zap, label: "2-Minute Setup", color: "#F4A259" },
                  { icon: Wallet, label: "Aptos Powered", color: "#6BB3D9" },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-3"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-sm text-[#4A5568] font-medium">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ============ STEP 2: WALLET CONNECTION ============ */}
        {step === "wallet" && (
          <motion.div
            key="wallet-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-10 md:space-y-16"
          >
            {/* Back Button */}
            <motion.button
              onClick={handleBack}
              className="absolute top-4 left-4 flex items-center gap-2 text-[#4A5568] hover:text-[#1A1A2E] transition-colors"
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </motion.button>

            {/* Header */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <motion.div 
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#F4A259]/15 to-[#E85A4F]/15 border border-[#F4A259]/30 backdrop-blur-sm"
                animate={{ 
                  boxShadow: ["0 0 0px rgba(244,162,89,0)", "0 0 25px rgba(244,162,89,0.2)", "0 0 0px rgba(244,162,89,0)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Wallet className="w-5 h-5 text-[#F4A259]" />
                <span className="text-sm font-medium bg-gradient-to-r from-[#F4A259] to-[#E85A4F] bg-clip-text text-transparent">Step 2 of 2: Connect Your Wallet</span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                <span className="block text-[#1A1A2E]">Connect Your</span>
                <span className="block mt-2 bg-gradient-to-r from-[#E85A4F] via-[#F4A259] to-[#F2B5D4] bg-clip-text text-transparent">
                  Aptos Wallet
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-[#4A5568] max-w-2xl mx-auto">
                {connected ? (
                  <>
                    <span className="text-[#2D9F6C] font-medium">✓ Wallet Connected!</span> Redirecting to your {selectedRole} dashboard...
                  </>
                ) : (
                  <>
                    Connect your wallet to access your {selectedRole === "employer" ? "employer dashboard and manage payroll" : "earned wages and start streaming"}
                  </>
                )}
              </p>
            </motion.div>

            {/* Wallet Connection Card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="max-w-lg mx-auto"
            >
              <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-[#E8DED4] shadow-xl p-8 md:p-12">
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-20 overflow-hidden rounded-3xl">
                  <motion.div 
                    className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${
                      selectedRole === "employer" 
                        ? "bg-gradient-to-br from-[#E85A4F] to-transparent" 
                        : "bg-gradient-to-br from-[#6BB3D9] to-transparent"
                    }`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </div>

                <div className="relative z-10 space-y-8">
                  {/* Role Badge */}
                  <div className="flex justify-center">
                    <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl ${
                      selectedRole === "employer"
                        ? "bg-gradient-to-r from-[#E85A4F]/10 to-[#F4A259]/10 border border-[#E85A4F]/20"
                        : "bg-gradient-to-r from-[#6BB3D9]/10 to-[#2B4570]/10 border border-[#6BB3D9]/20"
                    }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedRole === "employer"
                          ? "bg-gradient-to-br from-[#E85A4F] to-[#F4A259]"
                          : "bg-gradient-to-br from-[#6BB3D9] to-[#2B4570]"
                      }`}>
                        {selectedRole === "employer" ? (
                          <Building2 className="w-6 h-6 text-white" />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-[#718096]">Continuing as</div>
                        <div className={`text-lg font-bold ${
                          selectedRole === "employer" 
                            ? "text-[#E85A4F]" 
                            : "text-[#6BB3D9]"
                        }`}>
                          {selectedRole === "employer" ? "Employer" : "Employee"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Icon */}
                  <div className="flex justify-center">
                    <motion.div
                      className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl ${
                        connected
                          ? "bg-gradient-to-br from-[#2D9F6C] to-[#1a8754]"
                          : isLoading
                          ? "bg-gradient-to-br from-[#F4A259] to-[#E85A4F]"
                          : "bg-gradient-to-br from-[#E85A4F] to-[#F4A259]"
                      }`}
                      animate={isLoading ? { rotate: [0, 360] } : { scale: [1, 1.05, 1] }}
                      transition={isLoading ? { duration: 2, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
                    >
                      {connected ? (
                        <Check className="w-12 h-12 text-white" />
                      ) : isLoading ? (
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                      ) : (
                        <Wallet className="w-12 h-12 text-white" />
                      )}
                    </motion.div>
                  </div>

                  {/* Status Text */}
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-[#1A1A2E]">
                      {connected 
                        ? "Wallet Connected!" 
                        : isLoading 
                        ? "Connecting..." 
                        : "Connect Wallet to Continue"
                      }
                    </h3>
                    {connected && account?.address && (
                      <p className="text-sm font-mono text-[#4A5568] bg-[#FAF6F1] px-4 py-2 rounded-lg inline-block">
                        {account.address.toString().slice(0, 8)}...{account.address.toString().slice(-8)}
                      </p>
                    )}
                    {!connected && !isLoading && (
                      <p className="text-sm text-[#718096]">
                        Choose from Petra, Pontem, or other Aptos wallets
                      </p>
                    )}
                  </div>

                  {/* Connect Button */}
                  {!connected && (
                    <div className="flex justify-center relative">
                      <button
                        onClick={() => setShowWalletSelect(!showWalletSelect)}
                        className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#E85A4F] to-[#F4A259] rounded-xl font-semibold text-lg text-white hover:opacity-90 transition-all shadow-xl hover:shadow-2xl"
                      >
                        <Wallet className="w-5 h-5" />
                        <span>Select Wallet</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {showWalletSelect && (
                          <>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-40"
                              onClick={() => setShowWalletSelect(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-xl border border-[#E8DED4] shadow-xl overflow-hidden z-50"
                            >
                              <div className="px-4 py-2 text-xs font-medium text-[#718096] border-b border-[#E8DED4] bg-[#FAF6F1]">
                                Select Wallet
                              </div>
                              {availableWallets.length > 0 ? (
                                availableWallets.map((wallet) => (
                                  <button
                                    key={wallet.name}
                                    onClick={() => handleConnect(wallet.name)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF6F1] transition-colors text-left"
                                  >
                                    {wallet.icon && (
                                      <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded" />
                                    )}
                                    <span className="text-sm text-[#1A1A2E] font-medium">{wallet.name}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-[#718096]">
                                  No wallets found. Please install{" "}
                                  <a
                                    href="https://petra.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#E85A4F] hover:underline"
                                  >
                                    Petra
                                  </a>
                                  {" "}or another Aptos wallet.
                                </div>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Success State - Loading to Dashboard */}
                  {connected && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="flex items-center gap-3 px-5 py-3 bg-[#2D9F6C]/10 border border-[#2D9F6C]/20 rounded-xl">
                        <Loader2 className="w-5 h-5 text-[#2D9F6C] animate-spin" />
                        <span className="text-[#2D9F6C] font-medium">Redirecting to dashboard...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Supported Wallets */}
            {!connected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-4"
              >
                <p className="text-sm text-[#718096]">Supported Wallets</p>
                <div className="flex justify-center gap-6 flex-wrap">
                  {["Petra", "Pontem", "Nightly", "Martian", "Rise"].map((wallet, i) => (
                    <motion.div
                      key={wallet}
                      className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg border border-[#E8DED4] text-sm text-[#4A5568]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#E85A4F]/20 to-[#F4A259]/20 flex items-center justify-center">
                        <Wallet className="w-3 h-3 text-[#E85A4F]" />
                      </div>
                      {wallet}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
