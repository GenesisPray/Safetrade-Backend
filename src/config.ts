import dotenv from "dotenv";
import { Networks } from "@stellar/stellar-sdk";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  stellarNetwork: process.env.STELLAR_NETWORK || "testnet",
  sorobanRpcUrl: process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  horizonUrl: process.env.HORIZON_URL || "https://horizon-testnet.stellar.org",
  contractId: process.env.CONTRACT_ID || "",
  adminAddress: process.env.ADMIN_ADDRESS || "",
};

export function requireContractId(): string {
  if (!config.contractId) {
    throw new Error("CONTRACT_ID is not set");
  }
  return config.contractId;
}

export function networkPassphrase(): string {
  switch (config.stellarNetwork) {
    case "mainnet":
    case "public":
      return Networks.PUBLIC;
    case "futurenet":
      return Networks.FUTURENET;
    case "standalone":
      return Networks.STANDALONE;
    case "testnet":
    default:
      return Networks.TESTNET;
  }
}
