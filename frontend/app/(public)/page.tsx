"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WageCounter } from "@/components/shared/WageCounter";
import { GlassCard } from "@/components/shared/GlassCard";
import { 
  ArrowRight, ShieldCheck, Zap, Clock, Users, TrendingUp, Wallet, 
  CheckCircle, Building2, User, Sparkles, Play, 
  CircleDollarSign, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Animated background orbs - Light theme version
const FloatingOrb = ({ delay, duration, size, color, position }: {
  delay: number;
  duration: number;
  size: string;
  color: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
}) => (
  <motion.div
    className={`absolute ${size} rounded-full blur-[120px] opacity-20`}
    style={{ ...position, background: color }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.1, 0.25, 0.1],
      x: [0, 30, 0],
      y: [0, -30, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Animated particles - Light theme version
const Particle = ({ index }: { index: number }) => {
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 5;
  const randomDuration = 10 + Math.random() * 10;
  
  return (
    <motion.div
      className="absolute w-1 h-1 bg-[#E85A4F]/20 rounded-full"
      style={{ left: `${randomX}%`, top: "100%" }}
      animate={{
        y: [0, -1000],
        opacity: [0, 0.6, 0],
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

// 3D Card with tilt effect
const Card3D = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / 20);
    setRotateY((centerX - x) / 20);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      className={className}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
};

// Animated counter for stats
const AnimatedNumber = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState("0");
  
  useEffect(() => {
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    const prefix = value.replace(/[0-9.]/g, '').replace(suffix, '');
    let current = 0;
    const step = numericValue / 50;
    const interval = setInterval(() => {
      current += step;
      if (current >= numericValue) {
        setDisplayValue(prefix + numericValue + suffix);
        clearInterval(interval);
      } else {
        setDisplayValue(prefix + Math.floor(current) + suffix);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [value, suffix]);

  return <span>{displayValue}</span>;
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="flex flex-col overflow-hidden">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12">
        {/* Animated Background - Light Theme */}
        <div className="absolute inset-0 -z-10 bg-mesh">
          <FloatingOrb delay={0} duration={8} size="w-[600px] h-[600px]" color="#E85A4F" position={{ top: "10%", left: "-10%" }} />
          <FloatingOrb delay={2} duration={10} size="w-[500px] h-[500px]" color="#F4A259" position={{ top: "60%", right: "-5%" }} />
          <FloatingOrb delay={4} duration={12} size="w-[400px] h-[400px]" color="#6BB3D9" position={{ bottom: "10%", left: "30%" }} />
          <FloatingOrb delay={1} duration={9} size="w-[300px] h-[300px]" color="#F2B5D4" position={{ top: "40%", right: "20%" }} />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 grid-lines opacity-30" />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => <Particle key={i} index={i} />)}
          </div>
        </div>

        <motion.div 
          className="container mx-auto px-4 sm:px-6 lg:px-8"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8 text-center lg:text-left relative z-10"
            >
              {/* Animated Badge */}
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#E8DED4]/60 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-[#E85A4F]"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-medium text-gradient-gold">Powered by Aptos Blockchain</span>
                <Sparkles className="w-4 h-4 text-[#F4A259]" />
              </motion.div>
              
              {/* Main Headline */}
              <div className="space-y-2">
                <motion.h1 
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tighter text-[#1A1A2E]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <span className="block">Get Paid</span>
                  <motion.span 
                    className="block text-gradient-gold"
                    animate={{ 
                      textShadow: [
                        "0 0 20px rgba(232,90,79,0.3)",
                        "0 0 40px rgba(232,90,79,0.5)",
                        "0 0 20px rgba(232,90,79,0.3)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Every Second.
                  </motion.span>
                </motion.h1>
                <motion.p 
                  className="text-2xl sm:text-3xl text-[#4A5568] font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Not Monthly. Not Weekly. <span className="text-[#E85A4F] font-medium">Every. Single. Second.</span>
                </motion.p>
              </div>
              
              {/* Description */}
              <motion.p 
                className="text-lg text-[#4A5568] max-w-lg mx-auto lg:mx-0 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Revolutionary blockchain-powered wage streaming on Aptos. Watch your earnings flow in real-time, claim instantly whenever you need.
              </motion.p>
              
              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link href="/onboarding">
                  <Button size="xl" className="w-full sm:w-auto text-lg group btn-liquid">
                    <span className="relative z-10 flex items-center">
                      Start Streaming
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </Button>
                </Link>
                <Button variant="outline" size="xl" className="w-full sm:w-auto text-lg group">
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </motion.div>
              
              {/* Trust Badges */}
              <motion.div 
                className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  { icon: ShieldCheck, text: "Bank-grade Security", color: "text-[#2D9F6C]" },
                  { icon: Zap, text: "Instant Claims", color: "text-[#F4A259]" },
                  { icon: CircleDollarSign, text: "Zero Fees", color: "text-[#6BB3D9]" },
                ].map((badge, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05, x: 5 }}
                  >
                    <badge.icon className={`h-5 w-5 ${badge.color}`} />
                    <span className="text-sm text-[#4A5568]">{badge.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - 3D Interactive Card */}
            <motion.div
              initial={{ opacity: 0, x: 100, rotateY: -30 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <Card3D className="relative">
                <div className="counter-box p-1 rounded-3xl">
                  <div className="bg-white rounded-3xl shadow-lg">
                    <WageCounter />
                  </div>
                </div>
              </Card3D>
              
              {/* Floating Stats Cards */}
              <motion.div 
                className="absolute -top-6 -right-6 lg:-top-10 lg:-right-10 hidden md:block z-20"
                animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="card-cyber p-4 bg-white shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2D9F6C]/15 flex items-center justify-center">
                      <TrendingUp className="text-[#2D9F6C]" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-[#718096]">Total Streamed</div>
                      <div className="font-bold font-mono text-[#2D9F6C]">+24,580 USDC</div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-6 -left-6 lg:-bottom-10 lg:-left-10 hidden md:block z-20"
                animate={{ y: [0, 15, 0], rotate: [0, -2, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="card-holographic p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-wap-sky/20 flex items-center justify-center">
                      <Wallet className="text-wap-sky" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-wap-text-tertiary">Instant Claim</div>
                      <div className="font-bold font-mono">1,250.00 USDC</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Decorative Elements */}
              <motion.div
                className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-[500px] h-[500px] border border-wap-coral/10 rounded-full" />
              </motion.div>
              <motion.div
                className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-[600px] h-[600px] border border-wap-gold/10 rounded-full" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-aurora" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {[
              { value: "10", suffix: "M+ USDC", label: "Wages Streamed", icon: CircleDollarSign },
              { value: "500", suffix: "+", label: "Companies", icon: Building2 },
              { value: "50", suffix: "K+", label: "Employees", icon: Users },
              { value: "99.9", suffix: "%", label: "Uptime", icon: Zap },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 50, scale: 0.8 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
              >
                <Card3D>
                  <div className="card-frosted rounded-2xl p-6 relative overflow-hidden group">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-wap-coral/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <stat.icon className="w-8 h-8 text-wap-gold mx-auto mb-3" />
                    <div className="text-4xl md:text-5xl font-bold text-gradient-gold mb-2 font-mono">
                      <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-wap-text-secondary">{stat.label}</div>
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== PROBLEM SECTION ========== */}
      <section className="py-24 md:py-32 relative" id="features">
        <div className="absolute inset-0 hex-pattern" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wap-coral/10 border border-wap-coral/20 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-medium text-wap-coral">THE PROBLEM</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Why wait <span className="text-gradient-coral">30 days</span><br />
              for money you've <span className="text-gradient-gold">already earned?</span>
            </h2>
            <p className="text-xl text-wap-text-secondary">
              The traditional payroll system is fundamentally broken. We're here to fix it.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Clock, 
                title: "30 Day Wait", 
                desc: "70% of workers live paycheck to paycheck, desperately waiting weeks for money they've already earned.",
                stat: "70%",
                statLabel: "Financial Stress",
                color: "coral"
              },
              { 
                icon: TrendingUp, 
                title: "Predatory Loans", 
                desc: "When emergencies strike, employees turn to high-interest lenders—paying up to 400% APR for their own money.",
                stat: "400%",
                statLabel: "Average APR",
                color: "gold"
              },
              { 
                icon: Building2, 
                title: "Complex Payroll", 
                desc: "Employers waste 20+ hours monthly on complex calculations, compliance, and manual disbursements.",
                stat: "20hrs",
                statLabel: "Wasted Monthly",
                color: "sky"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <Card3D>
                  <div className="card-glow h-full rounded-3xl p-8 relative overflow-hidden group">
                    {/* Animated corner accent */}
                    <div className={`absolute top-0 right-0 w-32 h-32 ${
                      item.color === "coral" ? "bg-wap-coral/20" : 
                      item.color === "gold" ? "bg-wap-gold/20" : "bg-wap-sky/20"
                    } blur-3xl group-hover:scale-150 transition-transform duration-700`} />
                    
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative ${
                      item.color === "coral" ? "bg-wap-coral/10" : 
                      item.color === "gold" ? "bg-wap-gold/10" : "bg-wap-sky/10"
                    }`}>
                      <item.icon size={32} className={
                        item.color === "coral" ? "text-wap-coral" : 
                        item.color === "gold" ? "text-wap-gold" : "text-wap-sky"
                      } />
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-current opacity-50"
                        style={{ borderColor: item.color === "coral" ? "#F15B42" : item.color === "gold" ? "#FFD372" : "#7CAADC" }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-wap-text-secondary mb-6 leading-relaxed">{item.desc}</p>
                    
                    {/* Stat highlight */}
                    <div className="pt-6 border-t border-wap-hover/50">
                      <div className={`text-3xl font-bold font-mono ${
                        item.color === "coral" ? "text-wap-coral" : 
                        item.color === "gold" ? "text-wap-gold" : "text-wap-sky"
                      }`}>{item.stat}</div>
                      <div className="text-sm text-wap-text-tertiary">{item.statLabel}</div>
                    </div>
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SOLUTION / HOW IT WORKS ========== */}
      <section className="py-24 md:py-32 relative overflow-hidden" id="how-it-works">
        <div className="absolute inset-0 bg-aurora" />
        
        {/* Animated lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <motion.line
            x1="0" y1="50%" x2="100%" y2="50%"
            stroke="url(#gradient1)" strokeWidth="1"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2 }}
          />
          <defs>
            <linearGradient id="gradient1">
              <stop offset="0%" stopColor="#F15B42" />
              <stop offset="50%" stopColor="#FFD372" />
              <stop offset="100%" stopColor="#7CAADC" />
            </linearGradient>
          </defs>
        </svg>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wap-sky/10 border border-wap-sky/20 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-medium text-wap-sky">THE SOLUTION</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              How <span className="text-gradient-sky">WAP</span> Works
            </h2>
            <p className="text-xl text-wap-text-secondary">
              Seamless wage streaming in four simple steps
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-wap-coral via-wap-gold to-wap-sky transform -translate-y-1/2 z-0" />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {[
                { step: "01", title: "Sign Up", desc: "Create your account in under 2 minutes. No paperwork needed.", icon: User, color: "coral" },
                { step: "02", title: "Connect", desc: "Link your company's payroll system with our secure API.", icon: Building2, color: "gold" },
                { step: "03", title: "Stream", desc: "Wages flow to employees in real-time as they work.", icon: TrendingUp, color: "pink" },
                { step: "04", title: "Claim", desc: "Employees claim their earnings anytime, anywhere.", icon: Wallet, color: "sky" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative"
                >
                  {/* Step number floating */}
                  <motion.div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      item.color === "coral" ? "bg-wap-coral text-white" : 
                      item.color === "gold" ? "bg-wap-gold text-wap-dark" : 
                      item.color === "pink" ? "bg-wap-pink text-wap-dark" : "bg-wap-sky text-wap-dark"
                    } shadow-lg`}>
                      {item.step}
                    </div>
                  </motion.div>

                  <Card3D>
                    <div className="card-holographic rounded-3xl p-8 pt-12 text-center h-full">
                      <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                        item.color === "coral" ? "bg-wap-coral/10" : 
                        item.color === "gold" ? "bg-wap-gold/10" : 
                        item.color === "pink" ? "bg-wap-pink/10" : "bg-wap-sky/10"
                      }`}>
                        <item.icon size={32} className={
                          item.color === "coral" ? "text-wap-coral" : 
                          item.color === "gold" ? "text-wap-gold" : 
                          item.color === "pink" ? "text-wap-pink" : "text-wap-sky"
                        } />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-wap-text-secondary text-sm">{item.desc}</p>
                    </div>
                  </Card3D>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOR EMPLOYERS & EMPLOYEES ========== */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 dot-pattern" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Built for <span className="text-gradient-gold">Everyone</span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* For Employers */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card3D>
                <div className="card-cyber h-full p-8 lg:p-10 relative overflow-hidden">
                  {/* Animated background glow */}
                  <motion.div 
                    className="absolute top-0 right-0 w-64 h-64 bg-wap-coral/20 rounded-full blur-[100px]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-wap-coral/20 flex items-center justify-center">
                        <Building2 size={28} className="text-wap-coral" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">For Employers</h3>
                        <p className="text-wap-text-tertiary">Streamline your payroll</p>
                      </div>
                    </div>
                    
                    <p className="text-wap-text-secondary mb-8">
                      Reduce payroll costs, improve employee retention, and stay compliant with automated wage streaming.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {[
                        { label: "Cost Reduction", value: "30%" },
                        { label: "Time Saved", value: "20hrs" },
                        { label: "Retention Up", value: "45%" },
                        { label: "Setup Time", value: "2min" },
                      ].map((stat, i) => (
                        <div key={i} className="bg-wap-dark/50 rounded-xl p-4 border border-wap-hover/50">
                          <div className="text-2xl font-bold text-wap-coral font-mono">{stat.value}</div>
                          <div className="text-xs text-wap-text-tertiary">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {["Automated compliance", "Real-time analytics", "Zero hidden fees", "24/7 Support"].map((item, i) => (
                        <motion.li 
                          key={i} 
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <CheckCircle size={18} className="text-wap-green shrink-0" />
                          <span className="text-wap-text-secondary">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <Link href="/onboarding">
                      <Button variant="warm" size="lg" className="w-full group">
                        Start as Employer
                        <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card3D>
            </motion.div>

            {/* For Employees */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card3D>
                <div className="card-glow h-full p-8 lg:p-10 rounded-3xl relative overflow-hidden">
                  {/* Animated background glow */}
                  <motion.div 
                    className="absolute top-0 right-0 w-64 h-64 bg-wap-sky/20 rounded-full blur-[100px]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-wap-sky/20 flex items-center justify-center">
                        <User size={28} className="text-wap-sky" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">For Employees</h3>
                        <p className="text-wap-text-tertiary">Access your earnings</p>
                      </div>
                    </div>
                    
                    <p className="text-wap-text-secondary mb-8">
                      Watch your wages stream in real-time. Claim whenever you need—no more waiting until payday.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {[
                        { label: "Interest Rate", value: "0%" },
                        { label: "Claim Time", value: "<1min" },
                        { label: "Available", value: "24/7" },
                        { label: "Rewards", value: "Yes" },
                      ].map((stat, i) => (
                        <div key={i} className="bg-wap-dark/50 rounded-xl p-4 border border-wap-hover/50">
                          <div className="text-2xl font-bold text-wap-sky font-mono">{stat.value}</div>
                          <div className="text-xs text-wap-text-tertiary">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {["Instant wage access", "Zero interest ever", "Financial freedom", "Earn rewards & badges"].map((item, i) => (
                        <motion.li 
                          key={i} 
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <CheckCircle size={18} className="text-wap-green shrink-0" />
                          <span className="text-wap-text-secondary">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <Link href="/onboarding">
                      <Button variant="cool" size="lg" className="w-full group">
                        Join as Employee
                        <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card3D>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ========== CTA SECTION ========== */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 hex-pattern" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="counter-box p-1 rounded-[2rem]">
              <div className="bg-wap-dark rounded-[2rem] p-8 md:p-12 lg:p-20 text-center relative overflow-hidden">
                {/* Animated orbs */}
                <motion.div 
                  className="absolute top-1/4 left-1/4 w-64 h-64 bg-wap-coral/20 rounded-full blur-[100px]"
                  animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-wap-gold/20 rounded-full blur-[100px]"
                  animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
                  transition={{ duration: 10, repeat: Infinity }}
                />
                
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Sparkles className="w-12 h-12 text-wap-gold mx-auto mb-6" />
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                      Ready to revolutionize<br />
                      <span className="text-gradient-gold">your payroll?</span>
                    </h2>
                    <p className="text-xl text-wap-text-secondary mb-10 max-w-2xl mx-auto">
                      Join 500+ companies already using WAP to empower their workforce with real-time wage streaming.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link href="/onboarding">
                        <Button size="xl" className="w-full sm:w-auto text-lg btn-liquid">
                          <span className="relative z-10 flex items-center">
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </span>
                        </Button>
                      </Link>
                      <Button variant="outline" size="xl" className="w-full sm:w-auto text-lg">
                        Schedule Demo
                      </Button>
                    </div>
                    
                    <p className="text-sm text-wap-text-tertiary mt-6">
                      No credit card required • Free for 14 days • Cancel anytime
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-16 md:py-20 border-t border-wap-hover/30 relative">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <div className="relative w-32 h-12 mb-6">
                <Image src="/logo.svg" alt="WAP Logo" fill className="object-contain" />
              </div>
              <p className="text-wap-text-secondary mb-6 max-w-xs">
                Revolutionizing payroll with blockchain-powered real-time wage streaming.
              </p>
              <div className="flex gap-4">
                {/* Twitter/X */}
                <motion.a 
                  href="#" 
                  className="w-10 h-10 rounded-lg bg-wap-hover flex items-center justify-center text-wap-text-secondary hover:text-wap-coral hover:bg-wap-coral/10 transition-colors"
                  whileHover={{ y: -3, scale: 1.05 }}
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </motion.a>
                {/* LinkedIn */}
                <motion.a 
                  href="#" 
                  className="w-10 h-10 rounded-lg bg-wap-hover flex items-center justify-center text-wap-text-secondary hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors"
                  whileHover={{ y: -3, scale: 1.05 }}
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </motion.a>
                {/* Discord */}
                <motion.a 
                  href="#" 
                  className="w-10 h-10 rounded-lg bg-wap-hover flex items-center justify-center text-wap-text-secondary hover:text-[#5865F2] hover:bg-[#5865F2]/10 transition-colors"
                  whileHover={{ y: -3, scale: 1.05 }}
                  aria-label="Discord"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </motion.a>
                {/* GitHub */}
                <motion.a 
                  href="#" 
                  className="w-10 h-10 rounded-lg bg-wap-hover flex items-center justify-center text-wap-text-secondary hover:text-wap-text-primary hover:bg-wap-text-primary/10 transition-colors"
                  whileHover={{ y: -3, scale: 1.05 }}
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                  </svg>
                </motion.a>
              </div>
            </div>
            
            {[
              { title: "Product", links: ["Features", "Pricing", "Security", "Integrations"] },
              { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Cookies", "Compliance"] },
            ].map((column, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4 text-wap-text-primary">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link, j) => (
                    <li key={j}>
                      <Link 
                        href="#" 
                        className="text-sm text-wap-text-secondary hover:text-wap-coral transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-wap-hover/30 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-wap-text-tertiary">
              © 2025 WAP - Wage Allocation Protocol. All rights reserved.
            </p>
            <p className="text-sm text-wap-text-tertiary">
              Built with ❤️ on <span className="text-wap-coral">Aptos</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
