import { renderHook } from "@testing-library/react";
import { useContext } from "react";
import { describe, it, expect, vi } from "vitest";

import { AuthContext, type AuthContextType } from "@/lib/auth";
import { useAuth } from "@/lib/auth/hooks";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useContext: vi.fn(),
  };
});

describe("useAuth", () => {
  it("should throw an error when used outside of AuthProvider", () => {
    vi.mocked(useContext).mockReturnValue(null);

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");
    expect(useContext).toHaveBeenCalledWith(AuthContext);
  });

  it("should return the auth context correctly when inside a provider", () => {
    const mockContext: AuthContextType = {
      user: { id: "1", email: "test@example.com", name: "Test User", emailVerified: true },
      accessToken: "token123",
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      refresh: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendEmail: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      deleteAccount: vi.fn(),
    };

    vi.mocked(useContext).mockReturnValue(mockContext);

    const { result } = renderHook(() => useAuth());

    expect(result.current).toBe(mockContext);
    expect(useContext).toHaveBeenCalledWith(AuthContext);
  });

  it("should contain all expected properties in the context", () => {
    const mockContext: AuthContextType = {
      user: null,
      accessToken: null,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      refresh: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendEmail: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      deleteAccount: vi.fn(),
    };

    vi.mocked(useContext).mockReturnValue(mockContext);

    const { result } = renderHook(() => useAuth());
    const context = result.current;

    expect(context).toHaveProperty("user");
    expect(context).toHaveProperty("accessToken");
    expect(context).toHaveProperty("isLoading");
    expect(context).toHaveProperty("login");
    expect(context).toHaveProperty("logout");
    expect(context).toHaveProperty("signup");
    expect(context).toHaveProperty("refresh");
    expect(context).toHaveProperty("forgotPassword");
    expect(context).toHaveProperty("resetPassword");
    expect(context).toHaveProperty("verifyEmail");
    expect(context).toHaveProperty("resendEmail");
    expect(context).toHaveProperty("updateProfile");
    expect(context).toHaveProperty("changePassword");
    expect(context).toHaveProperty("deleteAccount");
  });
});
