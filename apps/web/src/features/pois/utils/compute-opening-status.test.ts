import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OpeningHoursPeriod } from "../types/poi-display-types";

import { computeOpeningStatusFromPeriods } from "./compute-opening-status";

const fridayMorning: OpeningHoursPeriod = {
  open: { day: 5, hour: 9, minute: 0 },
  close: { day: 5, hour: 18, minute: 0 },
};

const fridayLunch: OpeningHoursPeriod = {
  open: { day: 5, hour: 9, minute: 0 },
  close: { day: 5, hour: 12, minute: 0 },
};

const fridayOvernight: OpeningHoursPeriod = {
  open: { day: 5, hour: 18, minute: 0 },
  close: { day: 6, hour: 2, minute: 0 },
};

describe("computeOpeningStatusFromPeriods", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports open during a same-day period", () => {
    vi.setSystemTime(new Date(2026, 7, 21, 14, 30, 0));

    expect(computeOpeningStatusFromPeriods([fridayMorning])).toEqual(
      expect.objectContaining({ isOpen: true })
    );
  });

  it("reports closed with nextOpenAt after hours", () => {
    vi.setSystemTime(new Date(2026, 7, 21, 14, 30, 0));

    const status = computeOpeningStatusFromPeriods([fridayLunch]);

    expect(status.isOpen).toBe(false);
    expect(status.nextOpenAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(status.nextOpenAt as string))).toBe(false);
  });

  it("treats overnight periods as open before midnight and after", () => {
    vi.setSystemTime(new Date(2026, 7, 21, 23, 0, 0));
    expect(computeOpeningStatusFromPeriods([fridayOvernight]).isOpen).toBe(true);

    vi.setSystemTime(new Date(2026, 7, 22, 1, 0, 0));
    expect(computeOpeningStatusFromPeriods([fridayOvernight]).isOpen).toBe(true);
  });

  it("returns closed with no next opening when periods are empty", () => {
    vi.setSystemTime(new Date(2026, 7, 21, 14, 30, 0));

    expect(computeOpeningStatusFromPeriods([])).toEqual({
      isOpen: false,
      nextOpenAt: null,
    });
  });
});
