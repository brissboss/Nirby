import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PoiDisplayData } from "../types/poi-display-types";

import { PoiCard } from "./poi-card";

vi.mock("./poi-photo", () => ({
  PoiPhoto: ({ alt }: { alt: string }) => <div data-testid="poi-photo">{alt}</div>,
}));

const poi: PoiDisplayData = {
  id: "ChIJLU7jZClu5kcR4PcOOO6p3I0",
  name: "Tour Eiffel",
  address: "Champ de Mars, Paris",
  category: null,
  source: "google",
  photo: { kind: "url", url: "https://example.com/eiffel.jpg" },
  openingHours: null,
};

describe("PoiCard", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("calls onSelect when the overlay button is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<PoiCard poi={poi} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "select" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders the select overlay above card content so photo clicks work", () => {
    const { container } = render(<PoiCard poi={poi} onSelect={vi.fn()} />);
    const article = container.querySelector("article");
    const button = screen.getByRole("button", { name: "select" });

    expect(article?.lastElementChild).toBe(button);
    expect(button).toHaveClass("z-10");
  });

  it("applies the selected ring style", () => {
    const { container } = render(<PoiCard poi={poi} isSelected onSelect={vi.fn()} />);

    expect(container.querySelector("article")).toHaveClass("ring-2", "ring-primary");
  });

  it("scrolls the card into view when it becomes selected", () => {
    const scrollIntoView = vi.mocked(HTMLElement.prototype.scrollIntoView);

    const { rerender } = render(<PoiCard poi={poi} onSelect={vi.fn()} />);

    rerender(<PoiCard poi={poi} isSelected onSelect={vi.fn()} />);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", behavior: "smooth" });
  });
});
