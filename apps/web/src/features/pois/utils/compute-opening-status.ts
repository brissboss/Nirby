import type { OpeningHoursPeriod, PoiOpeningHours } from "../types/poi-display-types";

function toMinutes(day: number, hour: number, minute: number): number {
  return day * 24 * 60 + hour * 60 + minute;
}

export function computeOpeningStatusFromPeriods(periods: OpeningHoursPeriod[]): PoiOpeningHours {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday (aligné Google)
  const currentMinutes = currentDay * 24 * 60 + now.getHours() * 60 + now.getMinutes();

  let isOpen = false;
  let nextOpenAt: Date | null = null;

  for (const period of periods) {
    const openMin = toMinutes(period.open.day, period.open.hour, period.open.minute);
    let closeMin = toMinutes(period.close.day, period.close.hour, period.close.minute);

    // fermeture le lendemain (ex: ven 18h → sam 2h)
    if (closeMin <= openMin) {
      closeMin += 7 * 24 * 60;
    }

    const adjustedCurrent = currentMinutes;
    if (adjustedCurrent < openMin && period.open.day === currentDay) {
      // ok
    }

    // Simplification: compare sur fenêtre de 7 jours
    for (let offset = 0; offset < 7; offset++) {
      const dayOffset = offset * 24 * 60;
      const start = openMin + dayOffset;
      const end = closeMin + dayOffset;
      const nowAdj = currentMinutes;

      if (nowAdj >= start && nowAdj < end) {
        isOpen = true;
      }

      if (start > nowAdj) {
        const candidate = new Date(now);
        const daysUntil = Math.floor((start - nowAdj) / (24 * 60));
        const minutesInDay = start % (24 * 60);
        candidate.setDate(candidate.getDate() + daysUntil);
        candidate.setHours(Math.floor(minutesInDay / 60), minutesInDay % 60, 0, 0);

        if (!nextOpenAt || candidate < nextOpenAt) {
          nextOpenAt = candidate;
        }
      }
    }
  }

  return {
    isOpen,
    nextOpenAt: nextOpenAt?.toISOString() ?? null,
  };
}
