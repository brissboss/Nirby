import type { OpeningHoursPeriod } from "../types/poi-display-types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatOpeningHoursPeriods(periods: OpeningHoursPeriod[]): string[] {
  return periods.map((period) => {
    const openDay = DAY_LABELS[period.open.day] ?? String(period.open.day);
    const closeDay = DAY_LABELS[period.close.day] ?? String(period.close.day);
    const openTime = formatTime(period.open.hour, period.open.minute);
    const closeTime = formatTime(period.close.hour, period.close.minute);

    if (period.open.day === period.close.day) {
      return `${openDay} ${openTime} – ${closeTime}`;
    }

    return `${openDay} ${openTime} – ${closeDay} ${closeTime}`;
  });
}
