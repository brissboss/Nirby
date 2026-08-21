import { describe, expect, it } from "vitest";

import { formatOpeningHoursPeriods } from "./format-opening-hours";

describe("formatOpeningHoursPeriods", () => {
  it("formats same-day periods", () => {
    expect(
      formatOpeningHoursPeriods([
        { open: { day: 5, hour: 9, minute: 0 }, close: { day: 5, hour: 18, minute: 0 } },
      ])
    ).toEqual(["Fri 09:00 – 18:00"]);
  });

  it("formats overnight periods that close on another day", () => {
    expect(
      formatOpeningHoursPeriods([
        { open: { day: 5, hour: 18, minute: 0 }, close: { day: 6, hour: 2, minute: 0 } },
      ])
    ).toEqual(["Fri 18:00 – Sat 02:00"]);
  });

  it("falls back to the numeric day when the index is unknown", () => {
    expect(
      formatOpeningHoursPeriods([
        { open: { day: 7, hour: 10, minute: 5 }, close: { day: 7, hour: 11, minute: 0 } },
      ])
    ).toEqual(["7 10:05 – 11:00"]);
  });
});
