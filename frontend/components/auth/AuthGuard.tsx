"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUserRole } from "@/contexts/AptosWalletContext";
import { motion } from "framer-motion";
import { Wallet, Loader2, Shield, AlertTriangle, ChevronDown } from "lucide-react";
import { NETWORK } from "@/lib/aptos/config";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "employer" | "employee";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const { connected, isLoading, account, connect, wallets } = useWallet();
  const { role } = useUserRole();
  const [isChecking, setIsChecking] = useState(true);
  const [showWalletSelect, setShowWalletSelect] = useState(false);

  const availableWallets = wallets.filter(w => {
    const state = w.readyState as string;
    return state === "Installed" || state === "Loadable";
  });
  const shortAddress = account?.address 
    ? `${account.address.toString().slice(0, 6)}...${account.address.toString().slice(-4)}` 
    : "";

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setShowWalletSelect(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  useEffect(() => {
    // Give a moment for wallet to auto-connect
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Still checking
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center shadow-xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-[#1A1A2E]">Connecting...</h2>
            <p className="text-[#718096] text-sm">Checking wallet connection</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not connected - show connect prompt
  if (!connected) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-3xl border border-[#E8DED4] shadow-xl p-8 md:p-10 text-center space-y-6">
            {/* Icon */}
            <motion.div
              className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center shadow-xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wallet className="w-10 h-10 text-white" />
            </motion.div>

            {/* Content */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[#1A1A2E]">Wallet Not Connected</h2>
              <p className="text-[#4A5568]">
                Connect your Aptos wallet to access the dashboard and manage your wages.
              </p>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-sm text-[#718096]">
              <Shield className="w-4 h-4 text-[#2D9F6C]" />
              <span>Secure connection via Aptos blockchain</span>
            </div>

            {/* Connect Button */}
            <div className="pt-2 relative">
              <button
                onClick={() => setShowWalletSelect(!showWalletSelect)}
                className="w-full h-14 bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showWalletSelect && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E8DED4] shadow-xl overflow-hidden z-50"
                >
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
              )}
            </div>

            {/* Back to onboarding */}
            <button
              onClick={() => router.push("/onboarding")}
              className="text-sm text-[#718096] hover:text-[#E85A4F] transition-colors"
            >
              ← Back to role selection
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Connected but wrong role (if required role is specified)
  if (requiredRole && role !== requiredRole) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-3xl border border-[#E8DED4] shadow-xl p-8 md:p-10 text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#F4A259] to-[#E85A4F] flex items-center justify-center shadow-xl">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>

            {/* Content */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[#1A1A2E]">Access Restricted</h2>
              <p className="text-[#4A5568]">
                This dashboard is for {requiredRole}s only. You're currently signed in as {role || "an unregistered user"}.
              </p>
            </div>

            {/* Connected Wallet */}
            {account?.address && (
              <div className="bg-[#FAF6F1] rounded-xl px-4 py-3 text-sm">
                <span className="text-[#718096]">Connected: </span>
                <span className="font-mono text-[#1A1A2E]">
                  {shortAddress}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push(`/${requiredRole}`)}
                className="w-full h-12 bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Go to {requiredRole === "employer" ? "Employer" : "Employee"} Dashboard
              </button>
              <button
                onClick={() => router.push("/onboarding")}
                className="text-sm text-[#718096] hover:text-[#E85A4F] transition-colors"
              >
                ← Choose a different role
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // All good - render children
  return <>{children}</>;
}
