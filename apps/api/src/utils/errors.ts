import { z } from "zod";

import { ErrorCode } from "./error-codes";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function formatError(code: ErrorCode, message: string, details?: unknown) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
}

export function handleZodError(err: z.ZodError) {
  return err.errors.map((e: z.ZodIssue) => ({ field: e.path.join("."), code: e.message }));
}
