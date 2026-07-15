import { Router } from "express";
import * as contract from "../services/contract";
import { config } from "../config";
import { ApiError, asyncHandler } from "../utils/errors";
import { parseOrThrow, resolveDisputeSchema } from "../utils/validators";
import type { ApiResponse } from "../types/trade";

export const adminRouter = Router();

adminRouter.post(
  "/resolve",
  asyncHandler(async (req, res) => {
    const { tradeId, adminAddress, winnerAddress } = parseOrThrow(resolveDisputeSchema, req.body);

    if (config.adminAddress && adminAddress !== config.adminAddress) {
      throw new ApiError(403, "adminAddress is not authorized to resolve disputes");
    }

    const xdr = await contract.buildResolveDisputeTx(tradeId, adminAddress, winnerAddress);
    const body: ApiResponse<{ xdr: string }> = { success: true, data: { xdr } };
    res.json(body);
  })
);
