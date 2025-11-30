"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUserRole } from "@/contexts/AptosWalletContext";
import { useWalletBalance } from "@/hooks/useTreasury";
import { NETWORK } from "@/lib/aptos/config";
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  History,
  Gift,
  Menu,
  X,
  Copy,
  Check,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  role: "employer" | "employee";
}

export function Sidebar({ role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { account, disconnect } = useWallet();
  const { setRole } = useUserRole();
  const { balanceInApt, loading: balanceLoading, refetch: refetchBalance } = useWalletBalance();

  const address = account?.address?.toString() || "";
  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : "";

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    disconnect();
    setRole(null);
    localStorage.removeItem("wap_user_role");
    router.push("/onboarding");
  };

  const employerLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/employer" },
    { icon: Users, label: "Employees", href: "/employer/employees" },
    { icon: Wallet, label: "Treasury", href: "/employer/treasury" },
    { icon: FileText, label: "Reports", href: "/employer/reports" },
    { icon: Settings, label: "Settings", href: "/employer/settings" },
  ];

  const employeeLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/employee" },
    { icon: History, label: "Transactions", href: "/employee/transactions" },
    { icon: Gift, label: "Rewards", href: "/employee/rewards" },
    { icon: Briefcase, label: "Employment", href: "/employee/employment" },
    { icon: Settings, label: "Settings", href: "/employee/settings" },
  ];

  const links = role === "employer" ? employerLinks : employeeLinks;

  const SidebarContent = () => (
    <>
      {/* Logo Area */}
      <div className="h-16 lg:h-20 flex items-center justify-between px-4 border-b border-[#E8DED4]/60">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image src="/icon.svg" alt="WAP" fill className="object-contain" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-[#1A1A2E] to-[#2B4570] bg-clip-text text-transparent">
                WAP
              </span>
              <span className="text-[9px] tracking-widest text-[#718096] uppercase">Wage Protocol</span>
            </motion.div>
          )}
        </Link>
        
        {/* Desktop collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-[#F5EDE6] text-[#4A5568] hover:text-[#1A1A2E] hover:bg-[#E8DED4] transition-all"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5EDE6] text-[#4A5568] hover:text-[#1A1A2E]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map((link, index) => {
          const isActive = pathname === link.href;
          return (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-[#E85A4F]/15 to-transparent border-l-4 border-[#E85A4F] text-[#1A1A2E]"
                    : "text-[#4A5568] hover:bg-[#F5EDE6] hover:text-[#1A1A2E]"
                )}
              >
                <link.icon
                  size={22}
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    isActive ? "text-[#E85A4F]" : "group-hover:text-[#F4A259]"
                  )}
                />
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap">
                    {link.label}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Wallet Info & Logout */}
      <div className="p-3 border-t border-[#E8DED4]/60 space-y-2">
        {/* Wallet Address & Balance */}
        {account?.address && !isCollapsed && (
          <div className="px-3 py-2 bg-[#FAF6F1] rounded-xl space-y-2">
            {/* Address Row */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center flex-shrink-0">
                <Wallet size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-[#718096]">Connected</div>
                <div className="text-xs font-mono text-[#1A1A2E] truncate">{shortAddress}</div>
              </div>
              <button 
                onClick={copyAddress}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="Copy address"
              >
                {copied ? <Check size={14} className="text-[#2D9F6C]" /> : <Copy size={14} className="text-[#718096]" />}
              </button>
              <button 
                onClick={() => window.open(`https://explorer.aptoslabs.com/account/${address}?network=${NETWORK.toLowerCase()}`, "_blank")}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="View on explorer"
              >
                <ExternalLink size={14} className="text-[#718096]" />
              </button>
            </div>
            {/* Balance Row */}
            <div className="flex items-center justify-between pt-1 border-t border-[#E8DED4]/50">
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-[#718096]">Balance</div>
                <span className="text-sm font-semibold text-[#1A1A2E]">
                  {balanceLoading ? "..." : `${balanceInApt.toFixed(4)} APT`}
                </span>
              </div>
              <button 
                onClick={refetchBalance}
                className="p-1 hover:bg-white rounded-lg transition-colors"
                title="Refresh balance"
              >
                <RefreshCw size={12} className={cn("text-[#718096]", balanceLoading && "animate-spin")} />
              </button>
            </div>
          </div>
        )}
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-[#4A5568] hover:bg-[#E85A4F]/10 hover:text-[#E85A4F] transition-all",
            isCollapsed && "justify-center"
          )}
          title="Disconnect wallet and logout"
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-medium">Disconnect</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-lg border border-[#E8DED4] text-[#1A1A2E] shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 h-screen w-[280px] z-50 bg-white/98 backdrop-blur-xl border-r border-[#E8DED4]/60 flex flex-col shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex fixed left-0 top-0 h-screen z-40 bg-white/98 backdrop-blur-xl border-r border-[#E8DED4]/60 flex-col shadow-lg"
        initial={false}
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}
