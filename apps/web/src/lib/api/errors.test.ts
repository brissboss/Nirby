import { describe, it, expect } from "vitest";

import { isApiError, getErrorCode } from "@/lib/api/errors";

describe("isApiError", () => {
  it("should return true for a valid API error object with success: false and error.code", () => {
    const apiError = {
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      },
    };

    expect(isApiError(apiError)).toBe(true);
  });

  it("should return false for an object without success: false", () => {
    const notAnError = {
      success: true,
      error: {
        code: "SOMETHING",
      },
    };

    expect(isApiError(notAnError)).toBe(false);
  });

  it("should return false for an object without error property", () => {
    const notErrorProperty = {
      success: false,
    };

    expect(isApiError(notErrorProperty)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isApiError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isApiError(undefined)).toBe(false);
  });

  it("should return false for a string", () => {
    expect(isApiError("not an error")).toBe(false);
  });

  it("should return false for a number", () => {
    expect(isApiError(123)).toBe(false);
  });
});

describe("getErrorCode", () => {
  it("should return the error code for a valid API error with code", () => {
    const apiError = {
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      },
    };

    expect(getErrorCode(apiError)).toBe("INVALID_CREDENTIALS");
  });

  it("should return null for an API error without code (error.code undefined)", () => {
    const apiErrorWithoutCode = {
      success: false,
      error: {
        message: "Some error",
      },
    };
    expect(getErrorCode(apiErrorWithoutCode)).toBe(null);
  });

  it("should return null for an API error with error undefined", () => {
    const apiErrorWithUndefinedError = {
      success: false,
      error: undefined,
    };
    expect(getErrorCode(apiErrorWithUndefinedError)).toBe(null);
  });

  it("should return null for a non-Error object", () => {
    const notAnError = {
      someProperty: "value",
    };
    expect(getErrorCode(notAnError)).toBe(null);
  });

  it("should return null for null", () => {
    expect(getErrorCode(null)).toBe(null);
  });

  it("should return null for undefined", () => {
    expect(getErrorCode(undefined)).toBe(null);
  });
});
