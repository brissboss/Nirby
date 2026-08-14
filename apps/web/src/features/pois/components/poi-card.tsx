"use client";

import { ClockIcon, MapPinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";

import type { PoiDisplayData } from "../types/poi-display-types";

import { PoiOpeningHours } from "./poi-opening-hours";
import { PoiPhoto } from "./poi-photo";

import { cn } from "@/lib/utils";

type PoiCardProps = {
  poi: PoiDisplayData;
  actions?: ReactNode;
  badge?: ReactNode;
  isSelected?: boolean;
  onSelect?: () => void;
};

export function PoiCard({ poi, actions, badge, isSelected, onSelect }: PoiCardProps) {
  const tPoi = useTranslations("poi");
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);

  return (
    <article
      ref={cardRef}
      className={cn(
        "group relative flex flex-col items-start rounded-md border border-border shadow-sm",
        isSelected && "ring-2 ring-primary",
        onSelect && "cursor-pointer"
      )}
    >
      {poi.photo ? (
        <div className="relative overflow-hidden rounded-t-md h-[150px] w-full">
          <PoiPhoto photo={poi.photo} alt={poi.name} />
          {badge ? <div className="absolute top-2 right-2 z-20">{badge}</div> : null}
        </div>
      ) : null}
      <div className="px-4 py-2 flex flex-col gap-1 w-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-display text-base font-semibold tracking-tight">
            {poi.name}
          </h3>
          {actions ? (
            <div className="relative z-20 shrink-0 pointer-events-auto">{actions}</div>
          ) : null}
        </div>

        {poi.address ? (
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 wrap-break-words">
              {poi.address ?? tPoi("addressUnknown")}
            </span>
          </p>
        ) : null}

        {poi.openingHours ? (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5 shrink-0" aria-hidden />
            <PoiOpeningHours hours={poi.openingHours} />
          </div>
        ) : null}
      </div>
      {onSelect ? (
        <button
          type="button"
          className="absolute inset-0 z-10 rounded-md"
          aria-label={tPoi("select", { name: poi.name })}
          aria-pressed={isSelected}
          onClick={onSelect}
        />
      ) : null}
    </article>
  );
}
