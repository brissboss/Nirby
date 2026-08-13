import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExploreResultRow } from "./explore-result-row";

vi.mock("@/features/pois", () => ({
  getPoiDisplayDataFromGooglePlace: () => ({
    id: "gp-1",
    name: "Tour Eiffel",
    address: "Paris",
    category: null,
    source: "google",
    photo: null,
    openingHours: null,
  }),
  PoiCard: ({
    badge,
    actions,
  }: {
    badge?: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <div>
      {badge}
      {actions}
    </div>
  ),
}));

describe("ExploreResultRow", () => {
  it("shows a saved badge when the place is in at least one list", () => {
    render(
      <ExploreResultRow
        place={{ placeId: "gp-1", name: "Tour Eiffel" }}
        savedListCount={2}
        onAddToList={vi.fn()}
      />
    );

    expect(screen.getByText("results.savedIn")).toBeInTheDocument();
  });

  it("does not show a saved badge when the place is not in any list", () => {
    render(
      <ExploreResultRow
        place={{ placeId: "gp-1", name: "Tour Eiffel" }}
        savedListCount={0}
        onAddToList={vi.fn()}
      />
    );

    expect(screen.queryByText("results.savedIn")).not.toBeInTheDocument();
  });
});
