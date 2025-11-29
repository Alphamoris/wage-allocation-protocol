"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Sparkles, TrendingUp, Zap, Clock, ArrowUpRight } from "lucide-react";

export function WageCounter() {
  const [wage, setWage] = useState(1250.0);
  const springWage = useSpring(1250.0, { stiffness: 100, damping: 15 });
  const displayWage = useTransform(springWage, (latest) => latest.toFixed(4));
  const [progress, setProgress] = useState(45);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setWage((prev) => prev + 0.0015);
      setProgress((prev) => Math.min(prev + 0.01, 100));
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 200);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    springWage.set(wage);
  }, [wage, springWage]);

  const digits = displayWage.get().split('');

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {/* Outer Glow Ring - Light Theme */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#E85A4F] via-[#F4A259] to-[#F2B5D4] rounded-[2rem] opacity-20 blur-xl animate-pulse" />
      
      {/* Main Card - Light Theme */}
      <div className="relative bg-white rounded-[2rem] p-8 md:p-12 overflow-hidden border border-[#E8DED4]/60 shadow-xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Morphing blob */}
          <motion.div 
            className="absolute -top-20 -right-20 w-64 h-64 bg-[#E85A4F]/10 blob"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#F4A259]/10 blob"
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Scan line effect */}
          <motion.div 
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E85A4F]/30 to-transparent"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 grid-lines opacity-20" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF6F1] border border-[#2D9F6C]/30">
              <motion.div
                className="w-2 h-2 rounded-full bg-[#2D9F6C]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs font-medium text-[#2D9F6C] uppercase tracking-wider">Streaming Live</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF6F1] border border-[#F4A259]/30">
              <Clock size={14} className="text-[#F4A259]" />
              <span className="text-xs font-mono text-[#4A5568]">08:24:36</span>
            </div>
          </motion.div>
          
          {/* Main Counter Display */}
          <div className="relative">
            {/* Pulse effect on update */}
            <AnimatePresence>
              {showPulse && (
                <motion.div
                  className="absolute inset-0 bg-[#E85A4F]/10 rounded-3xl"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
            
            <div className="flex items-baseline justify-center font-mono">
              <motion.span 
                className="text-2xl md:text-4xl mr-3 text-[#E85A4F] font-semibold"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                USDC
              </motion.span>
              
              {/* Animated Digits */}
              <div className="flex">
                {digits.map((digit, i) => (
                  <motion.span
                    key={i}
                    className={`text-6xl sm:text-7xl md:text-9xl font-bold ${
                      digit === '.' ? 'text-[#718096] mx-1' : 'text-[#1A1A2E]'
                    }`}
                    style={{ 
                      fontVariantNumeric: "tabular-nums",
                      textShadow: digit !== '.' ? '0 0 30px rgba(232, 90, 79, 0.15)' : 'none'
                    }}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    {digit}
                  </motion.span>
                ))}
              </div>
            </div>
            
            {/* Rate indicator */}
            <motion.div 
              className="absolute -right-4 top-0 flex items-center gap-1 px-2 py-1 rounded-full bg-[#2D9F6C]/10 border border-[#2D9F6C]/30"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowUpRight size={12} className="text-[#2D9F6C]" />
              <span className="text-xs font-mono text-[#2D9F6C]">+0.15/s</span>
            </motion.div>
          </div>

          {/* Progress Section */}
          <div className="w-full max-w-md space-y-4 px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E85A4F]/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-[#E85A4F]" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-[#718096]">Today's Earnings</div>
                  <div className="text-sm font-semibold text-[#1A1A2E]">{(wage - 1250 + 850).toFixed(2)} USDC</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#718096]">Daily Target</div>
                <div className="text-sm font-mono font-bold text-[#F4A259]">{progress.toFixed(0)}%</div>
              </div>
            </div>
            
            {/* Advanced Progress Bar */}
            <div className="relative h-4 w-full bg-[#F5EDE6] rounded-full overflow-hidden border border-[#E8DED4]/50">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E85A4F] via-[#F4A259] to-[#F2B5D4] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              
              {/* Shimmer effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Progress marker */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-[#E85A4F]"
                style={{ left: `calc(${progress}% - 10px)` }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { label: "This Hour", value: "12.50 USDC", color: "text-[#E85A4F]" },
                { label: "This Week", value: "5,840 USDC", color: "text-[#F4A259]" },
                { label: "This Month", value: "24.5K USDC", color: "text-[#6BB3D9]" },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  className="text-center p-2 rounded-lg bg-[#FAF6F1] border border-[#E8DED4]/40"
                  whileHover={{ scale: 1.05, borderColor: "rgba(232, 90, 79, 0.3)" }}
                >
                  <div className={`text-sm font-mono font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-[#718096]">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-sm"
          >
            <Button 
              size="xl" 
              className="w-full text-lg group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Zap size={20} className="group-hover:animate-pulse" />
                Claim {wage.toFixed(2)} USDC
                <motion.span
                  className="absolute inset-0 bg-white/20 rounded-lg"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </span>
            </Button>
            <p className="text-xs text-[#718096] mt-3 text-center">
              Instant withdrawal • No fees • Powered by Aptos
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
