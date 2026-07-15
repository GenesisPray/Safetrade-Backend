import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors";
import type { ApiResponse } from "../types/trade";

export function notFoundHandler(_req: Request, res: Response) {
  const body: ApiResponse<never> = { success: false, error: "Not found" };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const details = err instanceof ApiError ? err.details : undefined;
  const message =
    typeof (err as { message?: unknown })?.message === "string"
      ? (err as { message: string }).message
      : "Internal server error";

  if (statusCode >= 500) {
    console.error(err);
  }

  const body: ApiResponse<never> = { success: false, error: message, details };
  res.status(statusCode).json(body);
}
