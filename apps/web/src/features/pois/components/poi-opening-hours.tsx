"use client";

import { useLocale, useTranslations } from "next-intl";

import type { PoiOpeningHours as PoiOpeningHoursType } from "../types/poi-display-types";
import { formatOpeningStatus } from "../utils/format-opening-status";

export function PoiOpeningHours({ hours }: { hours: PoiOpeningHoursType }) {
  const tPoi = useTranslations("poi");
  const locale = useLocale();

  const message = formatOpeningStatus(hours, locale, tPoi);

  return <span className={hours.isOpen ? "text-emerald-600" : undefined}>{message}</span>;
}
