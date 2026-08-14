import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePrivacyView } from "./profile-privacy-view.component";

const logout = vi.fn();
const exportMe = vi.fn();

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({ logout }),
  };
});

vi.mock("@/lib/api", () => ({
  exportMe: (...args: unknown[]) => exportMe(...args),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ProfilePrivacyView", () => {
  const onBack = vi.fn();
  const click = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    logout.mockResolvedValue(undefined);
    exportMe.mockResolvedValue({
      data: {
        exportedAt: "2026-08-14T12:00:00.000Z",
        profile: { id: "user-1", email: "export@example.com", emailVerified: true },
        createdPois: [],
        ownedLists: [],
        collaborations: [],
        sessions: [],
      },
    });

    URL.createObjectURL = vi.fn(() => "blob:export");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(click);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads a JSON export and toasts success", async () => {
    render(<ProfilePrivacyView onBack={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: "privacy.exportDownload" }));

    await waitFor(() => {
      expect(exportMe).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("privacy.exportSuccess");
    });
  });

  it("toasts an error when export fails", async () => {
    exportMe.mockResolvedValue({ data: undefined, error: { error: { code: "INTERNAL_ERROR" } } });

    render(<ProfilePrivacyView onBack={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: "privacy.exportDownload" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("privacy.exportError", {
        description: "API error message",
      });
    });
    expect(click).not.toHaveBeenCalled();
  });
});
