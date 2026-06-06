type TranslateFn = (key: string, values?: Record<string, string | number | Date>) => string;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTomorrow(next: Date, now: Date): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(next, tomorrow);
}

export function formatOpeningStatus(
  hours: { isOpen: boolean; nextOpenAt: string | null },
  locale: string,
  t: TranslateFn
): string {
  if (hours.isOpen) {
    return t("openingHours.openNow");
  }

  if (!hours.nextOpenAt) {
    return t("openingHours.closedNow");
  }

  const next = new Date(hours.nextOpenAt);
  const now = new Date();
  const time = next.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  if (isSameDay(next, now)) {
    return t("openingHours.opensAt", { time });
  }

  if (isTomorrow(next, now)) {
    return t("openingHours.opensTomorrowAt", { time });
  }

  const day = next.toLocaleDateString(locale, { weekday: "long" });
  return t("openingHours.opensDayAt", { day, time });
}
