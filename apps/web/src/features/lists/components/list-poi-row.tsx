"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { RemovePoiDialog } from "./remove-poi-dialog";

import { Button } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks";
import {
  PoiCard,
  getPoiDisplayDataFromSavedPoi,
  getSavedPoiMapId,
  type SavedPoiListItem,
} from "@/features/pois";
import { EditPoiDialog } from "@/features/pois/components/edit-poi-dialog";
import { canEditSavedPoi } from "@/features/pois/utils/can-edit-saved-poi";

type ListPoiRowProps = {
  savedPoi: SavedPoiListItem;
  listId: string;
  canRemove: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
};

export function ListPoiRow({ savedPoi, listId, canRemove, isSelected, onSelect }: ListPoiRowProps) {
  const tLists = useTranslations("lists");
  const tPoi = useTranslations("poi");
  const { user } = useAuth();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const display = getPoiDisplayDataFromSavedPoi(savedPoi);

  if (!display) {
    return null;
  }

  const showRemoveAction = canRemove && Boolean(savedPoi.id);
  const showEditAction = canEditSavedPoi(savedPoi, user?.id);
  const mapId = getSavedPoiMapId(savedPoi);
  const editablePoi = savedPoi.poi?.id ? { ...savedPoi.poi, id: savedPoi.poi.id } : null;

  return (
    <>
      <PoiCard
        poi={display}
        isSelected={isSelected}
        onSelect={mapId && onSelect ? () => onSelect(mapId) : undefined}
        actions={
          showEditAction || showRemoveAction ? (
            <div className="flex items-center">
              {showEditAction ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground/70"
                  aria-label={tPoi("edit.action")}
                  onClick={() => setEditDialogOpen(true)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              ) : null}
              {showRemoveAction ? (
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
              ) : null}
            </div>
          ) : undefined
        }
      />
      {showEditAction && editablePoi ? (
        <EditPoiDialog
          poi={editablePoi}
          listId={listId}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      ) : null}
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
