import {
  Account,
  BASE_FEE,
  Contract,
  Horizon,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import { config, networkPassphrase } from "../config";
import { ApiError } from "../utils/errors";

const horizon = new Horizon.Server(config.horizonUrl, {
  allowHttp: config.horizonUrl.startsWith("http://"),
});
const soroban = new rpc.Server(config.sorobanRpcUrl, {
  allowHttp: config.sorobanRpcUrl.startsWith("http://"),
});

export interface AccountInfo {
  id: string;
  sequence: string;
  balances: Horizon.HorizonApi.BalanceLine[];
}

export interface TradeTransaction {
  hash: string;
  createdAt: string;
  function: string;
  successful: boolean;
  ledger: number;
}

export async function getAccountInfo(address: string): Promise<AccountInfo> {
  try {
    const account = await horizon.loadAccount(address);
    return {
      id: account.id,
      sequence: account.sequenceNumber(),
      balances: account.balances,
    };
  } catch {
    throw new ApiError(404, `Account not found: ${address}`);
  }
}

export async function getTokenBalance(address: string, tokenId: string): Promise<string> {
  // Classic Stellar assets (including native XLM) are reflected directly on
  // the Horizon account record as trustline balances.
  if (tokenId === "native" || !tokenId.startsWith("C")) {
    const { balances } = await getAccountInfo(address);
    const line = balances.find((b) =>
      tokenId === "native"
        ? b.asset_type === "native"
        : "asset_issuer" in b && b.asset_issuer === tokenId
    );
    return line ? (line as { balance: string }).balance : "0";
  }

  // Soroban token contracts (SEP-41, including Stellar Asset Contracts)
  // aren't indexed on Horizon account records, so read `balance()` directly.
  const account = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase(),
  })
    .addOperation(
      new Contract(tokenId).call("balance", nativeToScVal(address, { type: "address" }))
    )
    .setTimeout(30)
    .build();

  const sim = await soroban.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new ApiError(400, `Failed to read token balance: ${sim.error}`);
  }
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    throw new ApiError(502, "Token balance simulation returned no result");
  }
  return (scValToNative(sim.result.retval) as bigint).toString();
}

// Horizon doesn't index Soroban contract state or events by argument, so we
// pull the invoke_host_function operations touching this contract and filter
// client-side for ones whose decoded parameters include the trade ID.
export async function getTradeTransactions(
  contractId: string,
  tradeId: number
): Promise<TradeTransaction[]> {
  const page = await horizon.operations().forAccount(contractId).order("desc").limit(200).call();

  const matches = page.records.filter(
    (op): op is Horizon.ServerApi.InvokeHostFunctionOperationRecord => {
      if (op.type !== "invoke_host_function") return false;
      return op.parameters.some((param) => {
        try {
          const value = scValToNative(xdr.ScVal.fromXDR(param.value, "base64"));
          return Number(value) === tradeId;
        } catch {
          return false;
        }
      });
    }
  );

  return Promise.all(
    matches.map(async (op) => {
      const tx = await op.transaction();
      return {
        hash: tx.hash,
        createdAt: tx.created_at,
        function: op.function,
        successful: tx.successful,
        ledger: tx.ledger_attr,
      };
    })
  );
}
