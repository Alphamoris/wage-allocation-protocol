"use client";

import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  AptosWalletAdapterProvider,
  useWallet as useAptosWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { aptos } from "@/lib/aptos/config";

// User role type
export type UserRole = "employer" | "employee" | null;

// Context for user role
interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const UserRoleContext = createContext<UserRoleContextType>({
  role: null,
  setRole: () => {},
});

export const useUserRole = () => useContext(UserRoleContext);

// User role provider
const UserRoleProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    // Load role from localStorage on mount
    const savedRole = localStorage.getItem("wap_user_role") as UserRole;
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  const updateRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole) {
      localStorage.setItem("wap_user_role", newRole);
    } else {
      localStorage.removeItem("wap_user_role");
    }
  };

  return (
    <UserRoleContext.Provider value={{ role, setRole: updateRole }}>
      {children}
    </UserRoleContext.Provider>
  );
};

// Combined Aptos Provider
interface AptosProviderProps {
  children: ReactNode;
}

export const AptosProvider: FC<AptosProviderProps> = ({ children }) => {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.TESTNET,
      }}
      onError={(error) => {
        console.error("Wallet adapter error:", error);
      }}
    >
      <UserRoleProvider>{children}</UserRoleProvider>
    </AptosWalletAdapterProvider>
  );
};

// Custom hook to check if user is authenticated (has wallet connected and role selected)
export const useAuth = () => {
  const {
    account,
    connected,
    disconnect,
    signAndSubmitTransaction,
    signMessage,
    wallet,
    wallets,
    connect,
    network,
  } = useAptosWallet();
  const { role, setRole } = useUserRole();

  const isAuthenticated = connected && role !== null;

  const logout = useCallback(() => {
    disconnect();
    setRole(null);
    localStorage.removeItem("wap_user_role");
  }, [disconnect, setRole]);

  // Get account balance
  const getBalance = useCallback(async (): Promise<bigint> => {
    if (!account?.address) return BigInt(0);
    try {
      const resources = await aptos.getAccountResource({
        accountAddress: account.address.toString(),
        resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
      });
      return BigInt((resources as { coin: { value: string } }).coin.value);
    } catch {
      return BigInt(0);
    }
  }, [account?.address]);

  return {
    isAuthenticated,
    isConnected: connected,
    account,
    address: account?.address?.toString() || null,
    role,
    setRole,
    logout,
    walletAddress: account?.address?.toString() || null,
    shortAddress: account?.address
      ? `${account.address.toString().slice(0, 6)}...${account.address.toString().slice(-4)}`
      : null,
    signAndSubmitTransaction,
    signMessage,
    wallet,
    wallets,
    connect,
    network,
    disconnect,
    getBalance,
  };
};

// Re-export useWallet from Aptos adapter for direct access
export { useWallet as useAptosWallet } from "@aptos-labs/wallet-adapter-react";
