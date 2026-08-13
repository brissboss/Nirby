"use client";

import { BookmarkCheckIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AddToListTarget } from "./add-to-list-picker";

import { Badge, Button } from "@/components/ui";
import { PoiCard, getPoiDisplayDataFromGooglePlace } from "@/features/pois";
import type { GooglePlace } from "@/lib/api";

type ExploreResultRowProps = {
  place: GooglePlace;
  savedListCount: number;
  onAddToList: (target: AddToListTarget) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
};

export function ExploreResultRow({
  place,
  savedListCount,
  onAddToList,
  isSelected,
  onSelect,
}: ExploreResultRowProps) {
  const tExplore = useTranslations("explore");
  const display = getPoiDisplayDataFromGooglePlace(place);

  if (!display || !place.placeId) {
    return null;
  }

  const googlePlaceId = place.placeId;

  return (
    <PoiCard
      poi={display}
      isSelected={isSelected}
      onSelect={onSelect ? () => onSelect(googlePlaceId) : undefined}
      badge={
        savedListCount > 0 ? (
          <Badge variant="secondary" className="gap-1 text-xs font-normal">
            <BookmarkCheckIcon className="size-3" aria-hidden />
            {tExplore("results.savedIn", { count: savedListCount })}
          </Badge>
        ) : null
      }
      actions={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground/70 hover:bg-primary/10 hover:text-primary"
          aria-label={tExplore("addToList.action")}
          onClick={() => onAddToList({ googlePlaceId, placeName: display.name })}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      }
    />
  );
}
