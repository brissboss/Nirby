import { renderHook } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useErrorMessage } from "@/hooks/use-error-message";
import { getErrorCode } from "@/lib/api/errors";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

vi.mock("@/lib/api/errors", () => ({
  getErrorCode: vi.fn(),
}));

describe("useErrorMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the translated message for a valid existing error code", () => {
    const mockHas = vi.fn((key: string) => key === "INVALID_CREDENTIALS");
    const mockT = vi.fn((key: string) => key);
    const mockTranslator = Object.assign(mockT, {
      has: mockHas,
      rich: vi.fn(),
      markup: vi.fn(),
      raw: vi.fn(),
    });

    vi.mocked(useTranslations).mockReturnValue(
      mockTranslator as unknown as ReturnType<typeof useTranslations>
    );
    vi.mocked(getErrorCode).mockReturnValue("INVALID_CREDENTIALS");

    const { result } = renderHook(() => useErrorMessage());
    const errorMessage = result.current({
      success: false,
      error: { code: "INVALID_CREDENTIALS" },
    });

    expect(mockHas).toHaveBeenCalledWith("INVALID_CREDENTIALS");
    expect(mockT).toHaveBeenCalledWith("INVALID_CREDENTIALS");
    expect(errorMessage).toBe("INVALID_CREDENTIALS");
  });

  it("should return 'INTERNAL_ERROR' for a non-existent error code", () => {
    const mockHas = vi.fn(() => false);
    const mockT = vi.fn((key: string) => key);
    const mockTranslator = Object.assign(mockT, {
      has: mockHas,
      rich: vi.fn(),
      markup: vi.fn(),
      raw: vi.fn(),
    });

    vi.mocked(useTranslations).mockReturnValue(
      mockTranslator as unknown as ReturnType<typeof useTranslations>
    );
    vi.mocked(getErrorCode).mockReturnValue("UNKNOWN_ERROR_CODE");

    const { result } = renderHook(() => useErrorMessage());
    const errorMessage = result.current({
      success: false,
      error: { code: "UNKNOWN_ERROR_CODE" },
    });

    expect(mockHas).toHaveBeenCalledWith("UNKNOWN_ERROR_CODE");
    expect(mockT).toHaveBeenCalledWith("INTERNAL_ERROR");
    expect(errorMessage).toBe("INTERNAL_ERROR");
  });

  it("should return 'INTERNAL_ERROR' when getErrorCode returns null", () => {
    const mockHas = vi.fn();
    const mockT = vi.fn((key: string) => key);
    const mockTranslator = Object.assign(mockT, {
      has: mockHas,
      rich: vi.fn(),
      markup: vi.fn(),
      raw: vi.fn(),
    });

    vi.mocked(useTranslations).mockReturnValue(
      mockTranslator as unknown as ReturnType<typeof useTranslations>
    );
    vi.mocked(getErrorCode).mockReturnValue(null);

    const { result } = renderHook(() => useErrorMessage());
    const errorMessage = result.current({ someInvalidError: true });

    expect(getErrorCode).toHaveBeenCalledWith({ someInvalidError: true });
    expect(mockHas).not.toHaveBeenCalled();
    expect(mockT).toHaveBeenCalledWith("INTERNAL_ERROR");
    expect(errorMessage).toBe("INTERNAL_ERROR");
  });

  it("should return 'INTERNAL_ERROR' for a null error", () => {
    const mockHas = vi.fn();
    const mockT = vi.fn((key: string) => key);
    const mockTranslator = Object.assign(mockT, {
      has: mockHas,
      rich: vi.fn(),
      markup: vi.fn(),
      raw: vi.fn(),
    });

    vi.mocked(useTranslations).mockReturnValue(
      mockTranslator as unknown as ReturnType<typeof useTranslations>
    );
    vi.mocked(getErrorCode).mockReturnValue(null);

    const { result } = renderHook(() => useErrorMessage());
    const errorMessage = result.current(null);

    expect(getErrorCode).toHaveBeenCalledWith(null);
    expect(mockT).toHaveBeenCalledWith("INTERNAL_ERROR");
    expect(errorMessage).toBe("INTERNAL_ERROR");
  });

  it("should return 'INTERNAL_ERROR' for an undefined error", () => {
    const mockHas = vi.fn();
    const mockT = vi.fn((key: string) => key);
    const mockTranslator = Object.assign(mockT, {
      has: mockHas,
      rich: vi.fn(),
      markup: vi.fn(),
      raw: vi.fn(),
    });

    vi.mocked(useTranslations).mockReturnValue(
      mockTranslator as unknown as ReturnType<typeof useTranslations>
    );
    vi.mocked(getErrorCode).mockReturnValue(null);

    const { result } = renderHook(() => useErrorMessage());
    const errorMessage = result.current(undefined);

    expect(getErrorCode).toHaveBeenCalledWith(undefined);
    expect(mockT).toHaveBeenCalledWith("INTERNAL_ERROR");
    expect(errorMessage).toBe("INTERNAL_ERROR");
  });

  it("should use useTranslations with 'errors.api' namespace", () => {
    const mockHas = vi.fn(() => true);
    const mockT = vi.fn((key: string) => key);
    const mockTranslator = Object.assign(mockT, {
      has: mockHas,
      rich: vi.fn(),
      markup: vi.fn(),
      raw: vi.fn(),
    });

    vi.mocked(useTranslations).mockReturnValue(
      mockTranslator as unknown as ReturnType<typeof useTranslations>
    );
    vi.mocked(getErrorCode).mockReturnValue("SOME_ERROR");

    renderHook(() => useErrorMessage());

    expect(useTranslations).toHaveBeenCalledWith("errors.api");
  });
});
