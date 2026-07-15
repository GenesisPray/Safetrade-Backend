export type TradeStatus = "Funded" | "Completed" | "Disputed" | "Cancelled";

export interface Trade {
  id: number;
  buyer: string;
  seller: string;
  token: string;
  amount: string; // in stroops as string
  deadline: number; // unix timestamp
  status: TradeStatus;
  item: string;
}

export interface CreateTradeInput {
  buyer: string;
  seller: string;
  token: string;
  amount: string;
  deadline: number;
  item: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
