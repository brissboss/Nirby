import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProfileDeleteAccountView } from "./profile-delete-account-view.component";

import { expectNoAxeViolations } from "@/test/axe";

vi.mock("../forms/delete-account-content", () => ({
  DeleteAccountContent: ({
    closeDialog,
    embedded,
  }: {
    closeDialog: () => void;
    embedded?: boolean;
  }) => (
    <div data-testid="delete-account-content" data-embedded={embedded ? "1" : "0"}>
      <button type="button" onClick={closeDialog}>
        close-form
      </button>
    </div>
  ),
}));

describe("ProfileDeleteAccountView", () => {
  it("renders the embedded form and goes back", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<ProfileDeleteAccountView onBack={onBack} />);

    expect(screen.getByRole("heading", { name: "deleteAccount.title" })).toBeInTheDocument();
    expect(screen.getByTestId("delete-account-content")).toHaveAttribute("data-embedded", "1");

    await user.click(screen.getByRole("button", { name: "common.buttons.back" }));
    expect(onBack).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "close-form" }));
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it("has no axe violations", async () => {
    const { container } = render(<ProfileDeleteAccountView onBack={vi.fn()} />);

    await expectNoAxeViolations(container);
  });
});
