"use client";

import { ClockIcon, MapPinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { PoiDisplayData } from "../types/poi-display-types";

import { PoiOpeningHours } from "./poi-opening-hours";
import { PoiPhoto } from "./poi-photo";

type PoiCardProps = {
  poi: PoiDisplayData;
  actions?: ReactNode;
};

export function PoiCard({ poi, actions }: PoiCardProps) {
  const tPoi = useTranslations("poi");

  return (
    <article className="group flex flex-col items-start rounded-md border border-border">
      {poi.photo ? (
        <div className="overflow-hidden rounded-t-md h-[150px] w-full">
          <PoiPhoto photo={poi.photo} alt={poi.name} />
        </div>
      ) : null}
      <div className="px-4 py-2 flex flex-col gap-1 w-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-display text-base font-semibold tracking-tight">
            {poi.name}
          </h3>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 wrap-break-words">{poi.address ?? tPoi("addressUnknown")}</span>
        </p>

        {poi.openingHours ? (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5 shrink-0" aria-hidden />
            <PoiOpeningHours hours={poi.openingHours} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
