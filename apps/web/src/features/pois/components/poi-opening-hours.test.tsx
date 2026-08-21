import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PoiOpeningHours } from "./poi-opening-hours";

describe("PoiOpeningHours", () => {
  it("renders the open status with the open color", () => {
    render(<PoiOpeningHours hours={{ isOpen: true, nextOpenAt: null }} />);

    const status = screen.getByText("openingHours.openNow");
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass("text-emerald-600");
  });

  it("renders the closed status without the open color", () => {
    render(<PoiOpeningHours hours={{ isOpen: false, nextOpenAt: null }} />);

    const status = screen.getByText("openingHours.closedNow");
    expect(status).toBeInTheDocument();
    expect(status).not.toHaveClass("text-emerald-600");
  });
});
