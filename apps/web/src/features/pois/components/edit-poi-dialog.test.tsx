import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EditPoiDialog } from "./edit-poi-dialog";

import type { Poi } from "@/lib/api";

vi.mock("../forms/edit-poi-form", () => ({
  EditPoiForm: ({
    closeDialog,
    listId,
    poi,
  }: {
    closeDialog: () => void;
    listId?: string;
    poi: Poi & { id: string };
  }) => (
    <div data-testid="edit-poi-form" data-list-id={listId ?? ""} data-poi-id={poi.id}>
      <button type="button" onClick={closeDialog}>
        close
      </button>
    </div>
  ),
}));

const poi: Poi & { id: string } = {
  id: "poi-1",
  name: "Secret spot",
  latitude: 48.8566,
  longitude: 2.3522,
};

function stubMatchMedia(matches: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

describe("EditPoiDialog", () => {
  afterEach(() => {
    stubMatchMedia(false);
  });

  it("renders a dialog on desktop and forwards the form close", async () => {
    stubMatchMedia(false);
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(<EditPoiDialog open onOpenChange={onOpenChange} poi={poi} listId="list-1" />);

    expect(document.querySelector('[data-slot="dialog-content"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
    expect(screen.getByRole("heading", { name: "edit.title" })).toBeInTheDocument();
    expect(screen.getByTestId("edit-poi-form")).toHaveAttribute("data-poi-id", "poi-1");
    expect(screen.getByTestId("edit-poi-form")).toHaveAttribute("data-list-id", "list-1");

    await user.click(screen.getByRole("button", { name: "close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders a drawer on mobile", () => {
    stubMatchMedia(true);

    render(<EditPoiDialog open onOpenChange={vi.fn()} poi={poi} listId="list-1" />);

    expect(document.querySelector('[data-slot="drawer-content"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();
    expect(screen.getByRole("heading", { name: "edit.title" })).toBeInTheDocument();
    expect(screen.getByTestId("edit-poi-form")).toBeInTheDocument();
  });
});
