import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListsCreateView } from "./lists-create-view";

vi.mock("../forms/create-list-form", () => ({
  CreateListForm: ({
    closeDialog,
    onCreated,
    embedded,
  }: {
    closeDialog?: () => void;
    onCreated?: (listId: string) => void;
    embedded?: boolean;
  }) => (
    <div data-testid="create-list-form" data-embedded={embedded ? "1" : "0"}>
      <button type="button" onClick={() => closeDialog?.()}>
        close
      </button>
      <button type="button" onClick={() => onCreated?.("list-1")}>
        created
      </button>
    </div>
  ),
}));

describe("ListsCreateView", () => {
  it("renders the create title and embedded form", () => {
    render(<ListsCreateView onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "create.title" })).toBeInTheDocument();
    expect(screen.getByTestId("create-list-form")).toHaveAttribute("data-embedded", "1");
  });

  it("goes back from the header and after create/close", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<ListsCreateView onBack={onBack} />);

    await user.click(screen.getByRole("button", { name: "common.buttons.back" }));
    expect(onBack).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "close" }));
    expect(onBack).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "created" }));
    expect(onBack).toHaveBeenCalledTimes(3);
  });
});
