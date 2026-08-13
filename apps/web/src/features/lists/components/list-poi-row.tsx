"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { RemovePoiDialog } from "./remove-poi-dialog";

import { Button } from "@/components/ui";
import {
  PoiCard,
  getPoiDisplayDataFromSavedPoi,
  getSavedPoiMapId,
  type SavedPoiListItem,
} from "@/features/pois";

type ListPoiRowProps = {
  savedPoi: SavedPoiListItem;
  listId: string;
  canRemove: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
};

export function ListPoiRow({ savedPoi, listId, canRemove, isSelected, onSelect }: ListPoiRowProps) {
  const tLists = useTranslations("lists");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const display = getPoiDisplayDataFromSavedPoi(savedPoi);

  if (!display) {
    return null;
  }

  const showRemoveAction = canRemove && Boolean(savedPoi.id);
  const mapId = getSavedPoiMapId(savedPoi);

  return (
    <>
      <PoiCard
        poi={display}
        isSelected={isSelected}
        onSelect={mapId && onSelect ? () => onSelect(mapId) : undefined}
        actions={
          showRemoveAction ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive"
              aria-label={tLists("removePoi.action")}
              onClick={() => setRemoveDialogOpen(true)}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          ) : undefined
        }
      />
      {showRemoveAction && savedPoi.id ? (
        <RemovePoiDialog
          listId={listId}
          savedPoiId={savedPoi.id}
          placeName={display.name}
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
        />
      ) : null}
    </>
  );
}
