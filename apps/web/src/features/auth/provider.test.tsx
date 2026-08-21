import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "./provider";

import { useAuth } from "@/features/auth/hooks";
import {
  login,
  logout,
  signup,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  updateMe,
  changePassword,
  deleteAccount,
} from "@/lib/api";

vi.mock("@/lib/api", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  refreshToken: vi.fn(),
  getMe: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
  updateMe: vi.fn(),
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
}));

const mockUser = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  emailVerified: true,
};

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as { data?: unknown; error?: unknown };
}

describe("AuthProvider", () => {
  let queryClient: QueryClient;

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  }

  async function renderAuth() {
    const hook = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false);
    });
    return hook;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(refreshToken).mockResolvedValue(apiResponse({}) as never);
  });

  it("finishes bootstrap with isLoading false and no user when refresh has no data", async () => {
    const { result } = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(refreshToken).toHaveBeenCalled();
  });

  it("loads the session when refresh and getMe succeed on mount", async () => {
    vi.mocked(refreshToken).mockResolvedValue(
      apiResponse({ data: { accessToken: "boot-token" } }) as never
    );
    vi.mocked(getMe).mockResolvedValue(apiResponse({ data: { user: mockUser } }) as never);

    const { result } = await renderAuth();

    expect(result.current.accessToken).toBe("boot-token");
    expect(result.current.user).toEqual(mockUser);
  });

  it("logs in, stores the token, and fetches the user", async () => {
    vi.mocked(login).mockResolvedValue(apiResponse({ data: { accessToken: "access-1" } }) as never);
    vi.mocked(getMe).mockResolvedValue(apiResponse({ data: { user: mockUser } }) as never);

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.login("user@example.com", "password1");
    });

    expect(login).toHaveBeenCalledWith({
      body: { email: "user@example.com", password: "password1" },
    });
    expect(result.current.accessToken).toBe("access-1");
    expect(result.current.user).toEqual(mockUser);
  });

  it("throws the API error when login has no data", async () => {
    const apiError = { code: "UNAUTHORIZED", message: "Invalid credentials" };
    vi.mocked(login).mockResolvedValue(apiResponse({ error: apiError }) as never);

    const { result } = await renderAuth();

    await expect(
      act(async () => {
        await result.current.login("user@example.com", "wrong");
      })
    ).rejects.toEqual(apiError);
  });

  it("signs up and returns the API payload", async () => {
    const data = { message: "Verify your email" };
    vi.mocked(signup).mockResolvedValue(apiResponse({ data }) as never);

    const { result } = await renderAuth();

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.signup("user@example.com", "password1", "fr");
    });

    expect(signup).toHaveBeenCalledWith({
      body: { email: "user@example.com", password: "password1", language: "fr" },
    });
    expect(resolved).toEqual(data);
  });

  it("throws when signup has no data", async () => {
    const apiError = { code: "EMAIL_ALREADY_EXISTS" };
    vi.mocked(signup).mockResolvedValue(apiResponse({ error: apiError }) as never);

    const { result } = await renderAuth();

    await expect(
      act(async () => {
        await result.current.signup("user@example.com", "password1");
      })
    ).rejects.toEqual(apiError);
  });

  it("clears session and query cache on logout even if the API fails", async () => {
    vi.mocked(login).mockResolvedValue(apiResponse({ data: { accessToken: "access-1" } }) as never);
    vi.mocked(getMe).mockResolvedValue(apiResponse({ data: { user: mockUser } }) as never);
    vi.mocked(logout).mockRejectedValue(new Error("network"));
    const clearSpy = vi.spyOn(queryClient, "clear");

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.login("user@example.com", "password1");
    });

    await act(async () => {
      await expect(result.current.logout()).rejects.toThrow("network");
    });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("sends a forgot-password request", async () => {
    vi.mocked(forgotPassword).mockResolvedValue(apiResponse({ data: { message: "ok" } }) as never);

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.forgotPassword("user@example.com", "en");
    });

    expect(forgotPassword).toHaveBeenCalledWith({
      body: { email: "user@example.com", language: "en" },
    });
  });

  it("throws when forgot-password has no data", async () => {
    const apiError = { code: "NOT_FOUND" };
    vi.mocked(forgotPassword).mockResolvedValue(apiResponse({ error: apiError }) as never);

    const { result } = await renderAuth();

    await expect(
      act(async () => {
        await result.current.forgotPassword("user@example.com");
      })
    ).rejects.toEqual(apiError);
  });

  it("resets the password with the token", async () => {
    vi.mocked(resetPassword).mockResolvedValue(apiResponse({ data: { message: "ok" } }) as never);

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.resetPassword("reset-token", "newpassword1");
    });

    expect(resetPassword).toHaveBeenCalledWith({
      body: { token: "reset-token", password: "newpassword1" },
    });
  });

  it("verifies email and returns the payload", async () => {
    const data = { user: mockUser };
    vi.mocked(verifyEmail).mockResolvedValue(apiResponse({ data }) as never);

    const { result } = await renderAuth();

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.verifyEmail("verify-token");
    });

    expect(verifyEmail).toHaveBeenCalledWith({ query: { token: "verify-token" } });
    expect(resolved).toEqual(data);
  });

  it("resends the verification email", async () => {
    vi.mocked(resendVerification).mockResolvedValue(
      apiResponse({ data: { message: "ok" } }) as never
    );

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.resendEmail("user@example.com");
    });

    expect(resendVerification).toHaveBeenCalledWith({ body: { email: "user@example.com" } });
  });

  it("updates the profile user on success", async () => {
    const updated = { ...mockUser, name: "New Name", bio: "Hello" };
    vi.mocked(updateMe).mockResolvedValue(apiResponse({ data: { user: updated } }) as never);

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.updateProfile("New Name", "https://cdn/avatar.png", "Hello");
    });

    expect(updateMe).toHaveBeenCalledWith({
      body: { name: "New Name", avatarUrl: "https://cdn/avatar.png", bio: "Hello" },
    });
    expect(result.current.user).toEqual(updated);
  });

  it("changes the password", async () => {
    vi.mocked(changePassword).mockResolvedValue(apiResponse({ data: { message: "ok" } }) as never);

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.changePassword("oldpassword1", "newpassword1");
    });

    expect(changePassword).toHaveBeenCalledWith({
      body: { oldPassword: "oldpassword1", newPassword: "newpassword1" },
    });
  });

  it("clears token and user after a successful account deletion", async () => {
    vi.mocked(login).mockResolvedValue(apiResponse({ data: { accessToken: "access-1" } }) as never);
    vi.mocked(getMe).mockResolvedValue(apiResponse({ data: { user: mockUser } }) as never);
    vi.mocked(deleteAccount).mockResolvedValue(apiResponse({ data: { message: "ok" } }) as never);

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.login("user@example.com", "password1");
    });

    await act(async () => {
      await result.current.deleteAccount("password1", "fr");
    });

    expect(deleteAccount).toHaveBeenCalledWith({
      body: { password: "password1", language: "fr" },
    });
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it("clears the session when refresh returns no data", async () => {
    vi.mocked(login).mockResolvedValue(apiResponse({ data: { accessToken: "access-1" } }) as never);
    vi.mocked(getMe).mockResolvedValue(apiResponse({ data: { user: mockUser } }) as never);

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.login("user@example.com", "password1");
    });

    vi.mocked(refreshToken).mockResolvedValue(apiResponse({}) as never);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it("clears the session when refresh throws", async () => {
    vi.mocked(login).mockResolvedValue(apiResponse({ data: { accessToken: "access-1" } }) as never);
    vi.mocked(getMe).mockResolvedValue(apiResponse({ data: { user: mockUser } }) as never);

    const { result } = await renderAuth();

    await act(async () => {
      await result.current.login("user@example.com", "password1");
    });

    vi.mocked(refreshToken).mockRejectedValue(new Error("offline"));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });
});
