"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Settings, Bell, Shield, User, Wallet, Globe, Moon, Sun,
  AlertCircle, Loader2, Save, Check, ExternalLink, Copy,
  Mail, Key, Lock, RefreshCw, Trash2, ChevronRight, Smartphone
} from "lucide-react";
import { useAuth } from "@/contexts/AptosWalletContext";
import { formatAddress } from "@/types";
import { GlassCard } from "@/components/shared/GlassCard";
import { getExplorerUrl, NETWORK } from "@/lib/aptos/config";

export default function EmployeeSettingsPage() {
  const { isConnected, address } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security" | "preferences">("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState({
    streamCreated: true,
    payments: true,
    withdrawals: true,
    rewards: true,
    emailNotifications: false,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "preferences" as const, label: "Preferences", icon: Settings },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-wap-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-wap-text-primary mb-2">Wallet Not Connected</h2>
          <p className="text-wap-text-secondary mb-4">Please connect your wallet to access settings.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-wap-text-primary to-wap-navy bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-wap-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-wap-border p-4 shadow-sm sticky top-24">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? "bg-linear-to-r from-wap-coral to-wap-gold text-white shadow-md"
                      : "text-wap-text-secondary hover:bg-wap-section"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto ${activeTab === tab.id ? "opacity-100" : "opacity-0"}`} />
                </button>
              ))}
            </nav>

            {/* Wallet Info Card */}
            <div className="mt-6 p-4 rounded-xl bg-wap-section border border-wap-border">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-wap-coral" />
                <span className="text-xs text-wap-text-tertiary uppercase tracking-wide">Connected Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-wap-text-primary truncate flex-1">
                  {formatAddress(address || "")}
                </span>
                <button onClick={copyAddress} className="p-1.5 rounded-lg hover:bg-white transition-colors">
                  {copied ? <Check className="w-4 h-4 text-wap-green" /> : <Copy className="w-4 h-4 text-wap-text-tertiary" />}
                </button>
              </div>
              <div className="mt-2">
                <a
                  href={getExplorerUrl(address || "", "account")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-wap-sky hover:underline flex items-center gap-1"
                >
                  View on Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl border border-wap-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-wap-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-wap-section">
                      <User className="w-5 h-5 text-wap-coral" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-wap-text-primary">Your Profile</h2>
                      <p className="text-sm text-wap-text-tertiary">Manage your personal information</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-wap-text-secondary mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 rounded-xl border border-wap-border focus:border-wap-coral focus:ring-1 focus:ring-wap-coral outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-wap-text-secondary mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-wap-text-tertiary" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-wap-border focus:border-wap-coral focus:ring-1 focus:ring-wap-coral outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-wap-section border border-wap-border">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-wap-navy" />
                      <div className="flex-1">
                        <h3 className="font-medium text-wap-text-primary">Wallet Address</h3>
                        <p className="text-sm text-wap-text-tertiary font-mono">{address}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={copyAddress}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-wap-border">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-linear-to-r from-wap-coral to-wap-gold text-white"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl border border-wap-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-wap-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-wap-section">
                      <Bell className="w-5 h-5 text-wap-gold" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-wap-text-primary">Notification Preferences</h2>
                      <p className="text-sm text-wap-text-tertiary">Choose what notifications you receive</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {[
                    { key: "streamCreated" as const, label: "New Stream", desc: "When a new wage stream is created for you" },
                    { key: "payments" as const, label: "Payments", desc: "Real-time updates on your earnings" },
                    { key: "withdrawals" as const, label: "Withdrawals", desc: "When you withdraw your wages" },
                    { key: "rewards" as const, label: "Rewards", desc: "When you earn Photon rewards" },
                    { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive notifications via email" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-wap-section transition-colors">
                      <div>
                        <h3 className="font-medium text-wap-text-primary">{item.label}</h3>
                        <p className="text-sm text-wap-text-tertiary">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key] ? "bg-wap-green" : "bg-wap-border"
                        }`}
                      >
                        <motion.div
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                          animate={{ left: notifications[item.key] ? "calc(100% - 20px)" : "4px" }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-wap-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-wap-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-wap-section">
                        <Shield className="w-5 h-5 text-wap-green" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-wap-text-primary">Security Settings</h2>
                        <p className="text-sm text-wap-text-tertiary">Manage your account security</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="p-4 rounded-xl bg-wap-section border border-wap-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-wap-coral" />
                          <div>
                            <h3 className="font-medium text-wap-text-primary">Wallet Authentication</h3>
                            <p className="text-sm text-wap-text-tertiary">Your wallet is your authentication method</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-wap-green/10 text-wap-green text-sm font-medium">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-wap-section border border-wap-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-wap-navy" />
                          <div>
                            <h3 className="font-medium text-wap-text-primary">Transaction Signing</h3>
                            <p className="text-sm text-wap-text-tertiary">All transactions require wallet signature</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-wap-green/10 text-wap-green text-sm font-medium">
                          Enabled
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-wap-section border border-wap-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-wap-sky" />
                          <div>
                            <h3 className="font-medium text-wap-text-primary">Connected Devices</h3>
                            <p className="text-sm text-wap-text-tertiary">This browser</p>
                          </div>
                        </div>
                        <span className="text-sm text-wap-text-tertiary">
                          1 device
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-wap-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-wap-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-wap-coral/10">
                        <Trash2 className="w-5 h-5 text-wap-coral" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-wap-text-primary">Danger Zone</h2>
                        <p className="text-sm text-wap-text-tertiary">Irreversible actions</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="p-4 rounded-xl border border-wap-coral/30 bg-wap-coral/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-wap-coral">Disconnect Account</h3>
                          <p className="text-sm text-wap-text-tertiary">This will log you out and clear local data</p>
                        </div>
                        <Button variant="outline" className="border-wap-coral text-wap-coral hover:bg-wap-coral hover:text-white">
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="bg-white rounded-2xl border border-wap-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-wap-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-wap-section">
                      <Settings className="w-5 h-5 text-wap-sky" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-wap-text-primary">Preferences</h2>
                      <p className="text-sm text-wap-text-tertiary">Customize your experience</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-wap-section">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-wap-text-secondary" />
                      <div>
                        <h3 className="font-medium text-wap-text-primary">Network</h3>
                        <p className="text-sm text-wap-text-tertiary">Current blockchain network</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-wap-navy/10 text-wap-navy text-sm font-medium capitalize">
                      {NETWORK}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-wap-section">
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5 text-wap-gold" />
                      <div>
                        <h3 className="font-medium text-wap-text-primary">Theme</h3>
                        <p className="text-sm text-wap-text-tertiary">Appearance settings</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-wap-gold/10 text-wap-gold text-sm font-medium">
                      Light
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-wap-section">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-wap-text-secondary" />
                      <div>
                        <h3 className="font-medium text-wap-text-primary">Auto Refresh</h3>
                        <p className="text-sm text-wap-text-tertiary">Automatically refresh data every 30 seconds</p>
                      </div>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-wap-green transition-colors">
                      <div className="absolute top-1 left-[calc(100%-20px)] w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
