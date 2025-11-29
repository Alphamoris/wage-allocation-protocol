// Export all Aptos utilities
export * from "./config";
export * from "./wageStreaming";
export * from "./employerTreasury";
export * from "./compliance";
export * from "./disputes";
export * from "./emergency";
export * from "./photonRewards";

// Re-export commonly used items with cleaner names
export { aptos as aptosClient } from "./config";
export { CONTRACT_ADDRESS, MODULES, NETWORK } from "./config";
export { octasToApt, aptToOctas, formatAddress } from "./config";
