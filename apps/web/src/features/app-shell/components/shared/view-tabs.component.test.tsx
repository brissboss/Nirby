import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ShellView } from "../../types/shell.types";

import { ViewTabs } from "./view-tabs.component";

function renderTabs(value: ShellView, onChange = vi.fn(), mobile = false) {
  return render(<ViewTabs value={value} onChange={onChange} mobile={mobile} />);
}

function viewButton(name: string) {
  return screen.getByRole("button", { name });
}

describe("ViewTabs", () => {
  it("marks only the active view with aria-current=page", () => {
    renderTabs("explore");

    expect(viewButton("tabs.explore")).toHaveAttribute("aria-current", "page");
    expect(viewButton("tabs.lists")).not.toHaveAttribute("aria-current");
    expect(viewButton("tabs.profile")).not.toHaveAttribute("aria-current");
  });

  it("moves aria-current when the active view changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = renderTabs("explore", onChange);

    await user.click(viewButton("tabs.lists"));

    expect(onChange).toHaveBeenCalledWith("lists");

    rerender(<ViewTabs value="lists" onChange={onChange} />);

    expect(viewButton("tabs.lists")).toHaveAttribute("aria-current", "page");
    expect(viewButton("tabs.explore")).not.toHaveAttribute("aria-current");
    expect(viewButton("tabs.profile")).not.toHaveAttribute("aria-current");
  });

  it("labels the navigation landmark", () => {
    renderTabs("explore");

    expect(screen.getByRole("navigation", { name: "tabs.navLabel" })).toBeInTheDocument();
  });

  it("keeps the same ARIA on the mobile variant", () => {
    renderTabs("profile", vi.fn(), true);

    expect(screen.getByRole("navigation", { name: "tabs.navLabel" })).toBeInTheDocument();
    expect(viewButton("tabs.profile")).toHaveAttribute("aria-current", "page");
    expect(viewButton("tabs.explore")).not.toHaveAttribute("aria-current");
    expect(viewButton("tabs.lists")).not.toHaveAttribute("aria-current");
  });
});
