import { Router } from "express";
import * as contract from "../services/contract";
import { asyncHandler } from "../utils/errors";
import {
  addressSchema,
  cancelTradeSchema,
  confirmTradeSchema,
  createTradeSchema,
  disputeTradeSchema,
  parseOrThrow,
  submitTxSchema,
  tradeIdSchema,
} from "../utils/validators";
import type { ApiResponse, Trade } from "../types/trade";

export const tradesRouter = Router();

tradesRouter.get(
  "/count",
  asyncHandler(async (_req, res) => {
    const count = await contract.getTradeCount();
    const body: ApiResponse<{ count: number }> = { success: true, data: { count } };
    res.json(body);
  })
);

tradesRouter.get(
  "/buyer/:address",
  asyncHandler(async (req, res) => {
    const address = parseOrThrow(addressSchema, req.params.address);
    const trades = await contract.getTradesByBuyer(address);
    const body: ApiResponse<Trade[]> = { success: true, data: trades };
    res.json(body);
  })
);

tradesRouter.get(
  "/seller/:address",
  asyncHandler(async (req, res) => {
    const address = parseOrThrow(addressSchema, req.params.address);
    const trades = await contract.getTradesBySeller(address);
    const body: ApiResponse<Trade[]> = { success: true, data: trades };
    res.json(body);
  })
);

tradesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseOrThrow(tradeIdSchema, req.params.id);
    const trade = await contract.getTrade(id);
    const body: ApiResponse<Trade> = { success: true, data: trade };
    res.json(body);
  })
);

tradesRouter.post(
  "/build",
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(createTradeSchema, req.body);
    const xdr = await contract.buildCreateTradeTx(input);
    const body: ApiResponse<{ xdr: string }> = { success: true, data: { xdr } };
    res.json(body);
  })
);

tradesRouter.post(
  "/submit",
  asyncHandler(async (req, res) => {
    const { xdr } = parseOrThrow(submitTxSchema, req.body);
    const result = await contract.submitTransaction(xdr);
    const body: ApiResponse<contract.SubmitResult> = { success: true, data: result };
    res.json(body);
  })
);

tradesRouter.post(
  "/confirm",
  asyncHandler(async (req, res) => {
    const { tradeId, buyerAddress } = parseOrThrow(confirmTradeSchema, req.body);
    const xdr = await contract.buildConfirmReceiptTx(tradeId, buyerAddress);
    const body: ApiResponse<{ xdr: string }> = { success: true, data: { xdr } };
    res.json(body);
  })
);

tradesRouter.post(
  "/cancel",
  asyncHandler(async (req, res) => {
    const { tradeId, callerAddress } = parseOrThrow(cancelTradeSchema, req.body);
    const xdr = await contract.buildCancelTradeTx(tradeId, callerAddress);
    const body: ApiResponse<{ xdr: string }> = { success: true, data: { xdr } };
    res.json(body);
  })
);

tradesRouter.post(
  "/dispute",
  asyncHandler(async (req, res) => {
    const { tradeId, buyerAddress } = parseOrThrow(disputeTradeSchema, req.body);
    const xdr = await contract.buildOpenDisputeTx(tradeId, buyerAddress);
    const body: ApiResponse<{ xdr: string }> = { success: true, data: { xdr } };
    res.json(body);
  })
);
