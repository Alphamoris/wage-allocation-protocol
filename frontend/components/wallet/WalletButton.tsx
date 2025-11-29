"use client";

import React from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Wallet, LogOut, Copy, Check, ExternalLink, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NETWORK } from "@/lib/aptos/config";

interface WalletButtonProps {
  variant?: "default" | "minimal" | "sidebar";
  className?: string;
}

export function WalletButton({ variant = "default", className = "" }: WalletButtonProps) {
  const { connected, account, disconnect, connect, wallets } = useWallet();
  const [copied, setCopied] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showWalletSelect, setShowWalletSelect] = React.useState(false);

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

  const explorerUrl = `https://explorer.aptoslabs.com/account/${address}?network=${NETWORK.toLowerCase()}`;

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setShowWalletSelect(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Available wallets
  const availableWallets = wallets.filter(w => {
    const state = w.readyState as string;
    return state === "Installed" || state === "Loadable";
  });

  if (!connected) {
    // Show connect button
    if (variant === "sidebar") {
      return (
        <div className={`relative ${className}`}>
          <motion.button
            onClick={() => setShowWalletSelect(!showWalletSelect)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#E85A4F] to-[#F4A259] hover:opacity-90 rounded-xl font-semibold text-white transition-all"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
            <ChevronDown className="w-4 h-4" />
          </motion.button>

          <AnimatePresence>
            {showWalletSelect && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-[#E8DED4] shadow-xl overflow-hidden z-50"
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
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        <motion.button
          onClick={() => setShowWalletSelect(!showWalletSelect)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#E85A4F] to-[#F4A259] hover:opacity-90 rounded-xl font-semibold text-white transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Wallet className="w-4 h-4" />
          <span>Connect Wallet</span>
          <ChevronDown className="w-4 h-4" />
        </motion.button>

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
                className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-[#E8DED4] shadow-xl overflow-hidden z-50"
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
    );
  }

  // Connected state
  if (variant === "sidebar") {
    return (
      <div className={`relative ${className}`}>
        <motion.button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#E85A4F]/10 to-[#F4A259]/10 hover:from-[#E85A4F]/20 hover:to-[#F4A259]/20 rounded-xl border border-[#E85A4F]/20 transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs text-[#718096]">Connected</div>
            <div className="text-sm font-mono text-[#1A1A2E]">{shortAddress}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#2D9F6C] animate-pulse" />
        </motion.button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-[#E8DED4] shadow-xl overflow-hidden z-50"
            >
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF6F1] transition-colors text-left"
              >
                {copied ? <Check className="w-4 h-4 text-[#2D9F6C]" /> : <Copy className="w-4 h-4 text-[#718096]" />}
                <span className="text-sm text-[#4A5568]">{copied ? "Copied!" : "Copy Address"}</span>
              </button>
              <button
                onClick={() => window.open(explorerUrl, "_blank")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF6F1] transition-colors text-left"
              >
                <ExternalLink className="w-4 h-4 text-[#718096]" />
                <span className="text-sm text-[#4A5568]">View on Explorer</span>
              </button>
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FEF2F2] transition-colors text-left border-t border-[#E8DED4]"
              >
                <LogOut className="w-4 h-4 text-[#E85A4F]" />
                <span className="text-sm text-[#E85A4F]">Disconnect</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default connected state (for header)
  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white rounded-xl border border-[#E8DED4] shadow-sm transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center">
          <Wallet className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-mono text-[#1A1A2E]">{shortAddress}</span>
        <div className="w-2 h-2 rounded-full bg-[#2D9F6C] animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl border border-[#E8DED4] shadow-xl overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-[#E8DED4] bg-[#FAF6F1]">
                <div className="text-xs text-[#718096]">Connected Wallet</div>
                <div className="text-sm font-mono text-[#1A1A2E] truncate">{address}</div>
              </div>
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF6F1] transition-colors text-left"
              >
                {copied ? <Check className="w-4 h-4 text-[#2D9F6C]" /> : <Copy className="w-4 h-4 text-[#718096]" />}
                <span className="text-sm text-[#4A5568]">{copied ? "Copied!" : "Copy Address"}</span>
              </button>
              <button
                onClick={() => window.open(explorerUrl, "_blank")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF6F1] transition-colors text-left"
              >
                <ExternalLink className="w-4 h-4 text-[#718096]" />
                <span className="text-sm text-[#4A5568]">View on Explorer</span>
              </button>
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FEF2F2] transition-colors text-left border-t border-[#E8DED4]"
              >
                <LogOut className="w-4 h-4 text-[#E85A4F]" />
                <span className="text-sm text-[#E85A4F]">Disconnect</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
