import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResetPasswordPage from "./page";

import { expectNoAxeViolations } from "@/test/axe";

const push = vi.fn();
const resetPassword = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({ resetPassword }),
  };
});

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function fulfilledSearchParams(token?: string) {
  const value = token ? { token } : {};
  return {
    status: "fulfilled" as const,
    value,
    then(resolve: (next: typeof value) => void) {
      resolve(value);
    },
  } as unknown as Promise<{ token?: string }>;
}

function renderPage(page: ReactNode) {
  return render(page);
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    push.mockClear();
    resetPassword.mockReset();
    resetPassword.mockResolvedValue(undefined);
  });

  it("resets the password and redirects to login when a token is present", async () => {
    renderPage(<ResetPasswordPage searchParams={fulfilledSearchParams("reset-token")} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("••••••••"), "newpassword1");
    await user.click(screen.getByRole("button", { name: "auth.resetPassword.resetPassword" }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith("reset-token", "newpassword1");
      expect(toast.success).toHaveBeenCalledWith("auth.resetPassword.resetPasswordSuccess", {
        description: "auth.resetPassword.resetPasswordSuccessDescription",
      });
      expect(push).toHaveBeenCalledWith("/login");
    });
  });

  it("shows an error toast when the token is missing", async () => {
    renderPage(<ResetPasswordPage searchParams={fulfilledSearchParams()} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("••••••••"), "newpassword1");
    await user.click(screen.getByRole("button", { name: "auth.resetPassword.resetPassword" }));

    await waitFor(() => {
      expect(resetPassword).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("auth.resetPassword.resetPasswordError", {
        description: "API error message",
      });
    });
  });

  it("shows an error toast when the reset fails", async () => {
    resetPassword.mockRejectedValue({ error: { code: "TOKEN_INVALID" } });
    renderPage(<ResetPasswordPage searchParams={fulfilledSearchParams("reset-token")} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("••••••••"), "newpassword1");
    await user.click(screen.getByRole("button", { name: "auth.resetPassword.resetPassword" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("auth.resetPassword.resetPasswordError", {
        description: "API error message",
      });
      expect(push).not.toHaveBeenCalled();
    });
  });

  it("has no axe violations", async () => {
    const { container } = renderPage(
      <ResetPasswordPage searchParams={fulfilledSearchParams("reset-token")} />
    );

    await expectNoAxeViolations(container);
  });
});
