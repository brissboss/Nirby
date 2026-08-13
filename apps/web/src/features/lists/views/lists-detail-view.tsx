"use client";

import { PencilIcon, Share2Icon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DeleteListDialog } from "../components/delete-list-dialog";
import { ListCollaboratorsSection } from "../components/list-collaborators-section";
import { ListPoisSection } from "../components/list-pois-section";
import { ListsDetailMetadata } from "../components/lists-detail-metadata";
import { ListsListQueryBoundary } from "../components/lists-list-query-boundary";
import { ListsSectionLayout } from "../components/lists-section-layout";
import { ShareListDialog } from "../components/share-list-dialog";
import {
  canDeleteList,
  canEditList,
  canManageShareAndEditLinks,
} from "../constants/lists.constants";
import { useList } from "../hooks/use-list";
import { useListMapPois } from "../hooks/use-list-map-pois";

import { Button } from "@/components/ui";
import { useShell } from "@/features/app-shell";
import { PoiMarkersLayer } from "@/features/map";

type ListsDetailViewProps = {
  listId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ListsDetailView({ listId, onBack, onEdit, onDelete }: ListsDetailViewProps) {
  const tLists = useTranslations("lists");
  const { selectedPoiId, selectPoi, clearSelection } = useShell();
  const { data } = useList(listId);
  const mapPois = useListMapPois(listId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const list = data?.list;

  return (
    <ListsSectionLayout
      title={list?.name ?? tLists("detail.title")}
      description={list?.description ?? undefined}
      onBack={onBack}
    >
      <PoiMarkersLayer
        pois={mapPois}
        selectedPoiId={selectedPoiId}
        onSelectPoi={selectPoi}
        onDeselect={clearSelection}
      />
      <ListsListQueryBoundary listId={listId}>
        {(loadedList) => (
          <div className="grid gap-6">
            <ListsDetailMetadata list={loadedList} />
            {(canEditList(loadedList.role) || canDeleteList(loadedList.role)) && (
              <div className="flex flex-wrap gap-2">
                {canManageShareAndEditLinks(loadedList.role) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2Icon className="size-4" />
                    {tLists("share.action")}
                  </Button>
                )}
                {canEditList(loadedList.role) && (
                  <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                    <PencilIcon className="size-4" />
                    {tLists("edit.action")}
                  </Button>
                )}
                {canDeleteList(loadedList.role) && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2Icon className="size-4" />
                    {tLists("delete.submit")}
                  </Button>
                )}
              </div>
            )}
            {canManageShareAndEditLinks(loadedList.role) && (
              <ShareListDialog
                listId={listId}
                shareToken={loadedList.shareToken}
                editToken={loadedList.editToken}
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
              />
            )}
            {canDeleteList(loadedList.role) && (
              <DeleteListDialog
                listId={listId}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onDeleted={onDelete}
              />
            )}
            <ListCollaboratorsSection
              listId={listId}
              role={loadedList.role}
              createdBy={loadedList.createdBy}
              onLeft={onBack}
            />
            <ListPoisSection
              listId={listId}
              role={loadedList.role}
              selectedPoiId={selectedPoiId}
              onSelectPoi={selectPoi}
            />
          </div>
        )}
      </ListsListQueryBoundary>
    </ListsSectionLayout>
  );
}
