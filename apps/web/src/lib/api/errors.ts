import type { Error } from "./generated/types.gen";

export function isApiError(data: unknown): data is Error {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    data.success === false &&
    "error" in data
  );
}

export function getErrorCode(error: unknown): string | null {
  if (isApiError(error)) {
    return error.error?.code ?? null;
  }
  return null;
}
