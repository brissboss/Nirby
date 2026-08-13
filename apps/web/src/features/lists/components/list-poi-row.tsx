"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { RemovePoiDialog } from "./remove-poi-dialog";

import { Button } from "@/components/ui";
import { PoiCard, getPoiDisplayDataFromSavedPoi, type SavedPoiListItem } from "@/features/pois";

type ListPoiRowProps = {
  savedPoi: SavedPoiListItem;
  listId: string;
  canRemove: boolean;
};

export function ListPoiRow({ savedPoi, listId, canRemove }: ListPoiRowProps) {
  const tLists = useTranslations("lists");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const display = getPoiDisplayDataFromSavedPoi(savedPoi);

  if (!display) {
    return null;
  }

  const showRemoveAction = canRemove && Boolean(savedPoi.id);

  return (
    <>
      <PoiCard
        poi={display}
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
