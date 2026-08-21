import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreatePoiDialog } from "./create-poi-dialog";

vi.mock("../forms/create-poi-form", () => ({
  CreatePoiForm: ({
    closeDialog,
    onCreated,
    listId,
    coordinates,
  }: {
    closeDialog: () => void;
    onCreated?: (poiId: string) => void;
    listId?: string;
    coordinates: { latitude: number; longitude: number };
  }) => (
    <div
      data-testid="create-poi-form"
      data-list-id={listId ?? ""}
      data-lat={String(coordinates.latitude)}
      data-lng={String(coordinates.longitude)}
    >
      <button type="button" onClick={closeDialog}>
        close
      </button>
      <button type="button" onClick={() => onCreated?.("poi-1")}>
        created
      </button>
    </div>
  ),
}));

const coordinates = { latitude: 48.8566, longitude: 2.3522 };

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

describe("CreatePoiDialog", () => {
  afterEach(() => {
    stubMatchMedia(false);
  });

  it("renders a dialog on desktop and forwards form callbacks", async () => {
    stubMatchMedia(false);
    const onOpenChange = vi.fn();
    const onCreated = vi.fn();
    const user = userEvent.setup();

    render(
      <CreatePoiDialog
        open
        onOpenChange={onOpenChange}
        onCreated={onCreated}
        listId="list-1"
        coordinates={coordinates}
      />
    );

    expect(document.querySelector('[data-slot="dialog-content"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
    expect(screen.getByRole("heading", { name: "create.title" })).toBeInTheDocument();
    expect(screen.getByTestId("create-poi-form")).toHaveAttribute("data-list-id", "list-1");
    expect(screen.getByTestId("create-poi-form")).toHaveAttribute("data-lat", "48.8566");

    await user.click(screen.getByRole("button", { name: "close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole("button", { name: "created" }));
    expect(onCreated).toHaveBeenCalledWith("poi-1");
  });

  it("renders a drawer on mobile", () => {
    stubMatchMedia(true);

    render(
      <CreatePoiDialog open onOpenChange={vi.fn()} listId="list-1" coordinates={coordinates} />
    );

    expect(document.querySelector('[data-slot="drawer-content"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();
    expect(screen.getByRole("heading", { name: "create.title" })).toBeInTheDocument();
    expect(screen.getByTestId("create-poi-form")).toBeInTheDocument();
  });
});
