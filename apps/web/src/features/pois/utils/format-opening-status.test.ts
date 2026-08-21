import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatOpeningStatus } from "./format-opening-status";

const t = vi.fn((key: string, values?: Record<string, string | number | Date>) =>
  values ? `${key}:${JSON.stringify(values)}` : key
);

describe("formatOpeningStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    t.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns openNow when the place is open", () => {
    expect(formatOpeningStatus({ isOpen: true, nextOpenAt: null }, "en-GB", t)).toBe(
      "openingHours.openNow"
    );
  });

  it("returns closedNow when there is no next opening", () => {
    expect(formatOpeningStatus({ isOpen: false, nextOpenAt: null }, "en-GB", t)).toBe(
      "openingHours.closedNow"
    );
  });

  it("returns opensAt when next opening is later today", () => {
    vi.setSystemTime(new Date(2026, 7, 21, 10, 0, 0));
    const nextOpenAt = new Date(2026, 7, 21, 18, 0, 0).toISOString();

    const message = formatOpeningStatus({ isOpen: false, nextOpenAt }, "en-GB", t);

    expect(message).toMatch(/^openingHours\.opensAt:/);
    expect(t).toHaveBeenCalledWith(
      "openingHours.opensAt",
      expect.objectContaining({ time: expect.any(String) })
    );
  });

  it("returns opensTomorrowAt when next opening is tomorrow", () => {
    vi.setSystemTime(new Date(2026, 7, 21, 22, 0, 0));
    const nextOpenAt = new Date(2026, 7, 22, 9, 0, 0).toISOString();

    const message = formatOpeningStatus({ isOpen: false, nextOpenAt }, "en-GB", t);

    expect(message).toMatch(/^openingHours\.opensTomorrowAt:/);
  });

  it("returns opensDayAt when next opening is later in the week", () => {
    vi.setSystemTime(new Date(2026, 7, 21, 10, 0, 0));
    const nextOpenAt = new Date(2026, 7, 24, 9, 0, 0).toISOString();

    const message = formatOpeningStatus({ isOpen: false, nextOpenAt }, "en-GB", t);

    expect(message).toMatch(/^openingHours\.opensDayAt:/);
    expect(t).toHaveBeenCalledWith(
      "openingHours.opensDayAt",
      expect.objectContaining({ day: expect.any(String), time: expect.any(String) })
    );
  });
});
