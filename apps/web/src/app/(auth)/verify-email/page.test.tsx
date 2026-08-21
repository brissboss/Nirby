import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VerifyEmailPage from "./page";

import { expectNoAxeViolations } from "@/test/axe";

const verifyEmail = vi.fn();
const resendEmail = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next-intl", async () => {
  const actual = await vi.importActual("next-intl");
  const t = Object.assign((key: string) => key, { has: () => false });
  return {
    ...actual,
    useTranslations: () => t,
    useLocale: () => "en",
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({ verifyEmail, resendEmail }),
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

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    verifyEmail.mockReset();
    resendEmail.mockReset();
    resendEmail.mockResolvedValue(undefined);
    searchParams = new URLSearchParams();
  });

  it("shows an error when the token is missing", async () => {
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText("auth.verifyEmail.errorTitle")).toBeInTheDocument();
    });
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it("shows success when verification returns a user", async () => {
    searchParams = new URLSearchParams("token=verify-token");
    verifyEmail.mockResolvedValue({ user: { id: "1" } });

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(verifyEmail).toHaveBeenCalledWith("verify-token");
      expect(screen.getByText("auth.verifyEmail.successTitle")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "auth.verifyEmail.goToLogin" })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("shows an error when verification throws", async () => {
    searchParams = new URLSearchParams("token=bad-token");
    verifyEmail.mockRejectedValue({ error: { code: "TOKEN_INVALID" } });

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText("auth.verifyEmail.errorTitle")).toBeInTheDocument();
    });
  });

  it("resends the verification email from the error state", async () => {
    searchParams = new URLSearchParams("token=bad-token&email=user@example.com");
    verifyEmail.mockRejectedValue({ error: { code: "TOKEN_INVALID" } });

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "auth.verifyEmail.resendEmail" })
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "auth.verifyEmail.resendEmail" }));

    await waitFor(() => {
      expect(resendEmail).toHaveBeenCalledWith("user@example.com");
      expect(toast.success).toHaveBeenCalledWith("auth.verifyEmail.emailResent");
    });
  });

  it("has no axe violations on the missing-token error state", async () => {
    const { container } = render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText("auth.verifyEmail.errorTitle")).toBeInTheDocument();
    });

    await expectNoAxeViolations(container);
  });
});
