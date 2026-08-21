import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthGate } from "./auth-gate.component";

import { AuthContext, type AuthContextType } from "@/features/auth/context";

function authValue(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: null,
    accessToken: null,
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
    ...overrides,
  };
}

describe("AuthGate", () => {
  it("shows a loading spinner while auth is resolving", () => {
    render(
      <AuthContext.Provider value={authValue({ isLoading: true })}>
        <AuthGate>
          <p>Protected</p>
        </AuthGate>
      </AuthContext.Provider>
    );

    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("shows AuthRequiredPrompt when there is no user", () => {
    render(
      <AuthContext.Provider value={authValue({ isLoading: false, user: null })}>
        <AuthGate>
          <p>Protected</p>
        </AuthGate>
      </AuthContext.Provider>
    );

    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "login" })).toHaveAttribute("href", "/login");
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("renders children when the user is authenticated", () => {
    render(
      <AuthContext.Provider
        value={authValue({
          isLoading: false,
          user: { id: "1", email: "user@example.com", name: "User", emailVerified: true },
        })}
      >
        <AuthGate>
          <p>Protected</p>
        </AuthGate>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });
});
