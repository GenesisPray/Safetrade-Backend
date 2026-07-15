import { z } from "zod";
import { ApiError } from "./errors";

export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError(400, "Invalid request", result.error.flatten());
  }
  return result.data;
}

export const addressSchema = z
  .string()
  .regex(/^[GC][A-Z2-7]{55}$/, "Invalid Stellar address");

export const amountSchema = z
  .string()
  .regex(/^[0-9]+$/, "Amount must be a non-negative integer string (stroops)");

export const tradeIdSchema = z.coerce.number().int().nonnegative();

export const createTradeSchema = z.object({
  buyer: addressSchema,
  seller: addressSchema,
  token: addressSchema,
  amount: amountSchema,
  deadline: z.number().int().positive(),
  item: z.string().min(1).max(500),
});

export const confirmTradeSchema = z.object({
  tradeId: tradeIdSchema,
  buyerAddress: addressSchema,
});

export const cancelTradeSchema = z.object({
  tradeId: tradeIdSchema,
  callerAddress: addressSchema,
});

export const disputeTradeSchema = z.object({
  tradeId: tradeIdSchema,
  buyerAddress: addressSchema,
});

export const resolveDisputeSchema = z.object({
  tradeId: tradeIdSchema,
  adminAddress: addressSchema,
  winnerAddress: addressSchema,
});

export const submitTxSchema = z.object({
  xdr: z.string().min(1),
});
