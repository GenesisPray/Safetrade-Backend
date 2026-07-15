import {
  Account,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import { config, networkPassphrase, requireContractId } from "../config";
import { ApiError } from "../utils/errors";
import type { CreateTradeInput, Trade, TradeStatus } from "../types/trade";

const server = new rpc.Server(config.sorobanRpcUrl, {
  allowHttp: config.sorobanRpcUrl.startsWith("http://"),
});

function getContract(): Contract {
  return new Contract(requireContractId());
}

// Soroban RPC has no unauthenticated "read" endpoint for contract state, so
// reads are done by simulating an invocation from a throwaway account. The
// simulation never touches the ledger, so the account doesn't need to exist.
function simulationAccount(): Account {
  return new Account(Keypair.random().publicKey(), "0");
}

async function simulateCall(method: string, args: xdr.ScVal[] = []): Promise<unknown> {
  const tx = new TransactionBuilder(simulationAccount(), {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase(),
  })
    .addOperation(getContract().call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    throw new ApiError(400, `Contract simulation failed: ${sim.error}`);
  }
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    throw new ApiError(502, "Contract simulation returned no result");
  }

  return scValToNative(sim.result.retval);
}

async function buildInvokeTx(
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  let account: Account;
  try {
    account = await server.getAccount(sourceAddress);
  } catch {
    throw new ApiError(404, `Source account not found: ${sourceAddress}`);
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase(),
  })
    .addOperation(getContract().call(method, ...args))
    .setTimeout(30)
    .build();

  try {
    const prepared = await server.prepareTransaction(tx);
    return prepared.toXDR();
  } catch (err) {
    throw new ApiError(400, `Failed to prepare transaction: ${(err as Error).message}`);
  }
}

const TRADE_STATUSES: TradeStatus[] = ["Funded", "Completed", "Disputed", "Cancelled"];

function parseTradeStatus(raw: unknown): TradeStatus {
  // Soroban unit enum variants (no associated data) decode via scValToNative
  // as a one-element array containing the variant name.
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (TRADE_STATUSES.includes(value as TradeStatus)) {
    return value as TradeStatus;
  }
  throw new ApiError(502, `Unrecognized trade status from contract: ${JSON.stringify(raw)}`);
}

function parseTrade(raw: any): Trade {
  return {
    id: Number(raw.id),
    buyer: String(raw.buyer),
    seller: String(raw.seller),
    token: String(raw.token),
    amount: raw.amount.toString(),
    deadline: Number(raw.deadline),
    status: parseTradeStatus(raw.status),
    item: String(raw.item),
  };
}

export async function getTrade(tradeId: number): Promise<Trade> {
  const raw = await simulateCall("get_trade", [nativeToScVal(tradeId, { type: "u32" })]);
  return parseTrade(raw);
}

export async function getTradeCount(): Promise<number> {
  const raw = await simulateCall("get_trade_count");
  return Number(raw);
}

export async function getTradesByBuyer(buyerAddress: string): Promise<Trade[]> {
  const raw = await simulateCall("get_trades_by_buyer", [
    nativeToScVal(buyerAddress, { type: "address" }),
  ]);
  return (raw as unknown[]).map(parseTrade);
}

export async function getTradesBySeller(sellerAddress: string): Promise<Trade[]> {
  const raw = await simulateCall("get_trades_by_seller", [
    nativeToScVal(sellerAddress, { type: "address" }),
  ]);
  return (raw as unknown[]).map(parseTrade);
}

export async function buildCreateTradeTx(input: CreateTradeInput): Promise<string> {
  const args = [
    nativeToScVal(input.buyer, { type: "address" }),
    nativeToScVal(input.seller, { type: "address" }),
    nativeToScVal(input.token, { type: "address" }),
    nativeToScVal(BigInt(input.amount), { type: "i128" }),
    nativeToScVal(input.deadline, { type: "u64" }),
    nativeToScVal(input.item, { type: "string" }),
  ];
  return buildInvokeTx(input.buyer, "create_trade", args);
}

export async function buildConfirmReceiptTx(
  tradeId: number,
  buyerAddress: string
): Promise<string> {
  const args = [
    nativeToScVal(tradeId, { type: "u32" }),
    nativeToScVal(buyerAddress, { type: "address" }),
  ];
  return buildInvokeTx(buyerAddress, "confirm_receipt", args);
}

export async function buildCancelTradeTx(
  tradeId: number,
  callerAddress: string
): Promise<string> {
  const args = [
    nativeToScVal(tradeId, { type: "u32" }),
    nativeToScVal(callerAddress, { type: "address" }),
  ];
  return buildInvokeTx(callerAddress, "cancel_trade", args);
}

export async function buildOpenDisputeTx(
  tradeId: number,
  buyerAddress: string
): Promise<string> {
  const args = [
    nativeToScVal(tradeId, { type: "u32" }),
    nativeToScVal(buyerAddress, { type: "address" }),
  ];
  return buildInvokeTx(buyerAddress, "open_dispute", args);
}

export interface SubmitResult {
  hash: string;
  status: string;
}

export async function submitTransaction(signedXdr: string): Promise<SubmitResult> {
  const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase());

  const result = await server.sendTransaction(tx);
  if (result.status === "ERROR") {
    throw new ApiError(400, "Transaction submission failed", result.errorResult);
  }

  return { hash: result.hash, status: result.status };
}

export async function buildResolveDisputeTx(
  tradeId: number,
  adminAddress: string,
  winnerAddress: string
): Promise<string> {
  const args = [
    nativeToScVal(tradeId, { type: "u32" }),
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(winnerAddress, { type: "address" }),
  ];
  return buildInvokeTx(adminAddress, "resolve_dispute", args);
}
