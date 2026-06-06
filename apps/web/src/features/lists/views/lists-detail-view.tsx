"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DeleteListDialog } from "../components/delete-list-dialog";
import { ListPoisSection } from "../components/list-pois-section";
import { ListsDetailMetadata } from "../components/lists-detail-metadata";
import { ListsListQueryBoundary } from "../components/lists-list-query-boundary";
import { ListsSectionLayout } from "../components/lists-section-layout";
import { canDeleteList, canEditList } from "../constants/lists.constants";
import { useList } from "../hooks/use-list";

import { Button } from "@/components/ui";

type ListsDetailViewProps = {
  listId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ListsDetailView({ listId, onBack, onEdit, onDelete }: ListsDetailViewProps) {
  const tLists = useTranslations("lists");
  const { data } = useList(listId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const list = data?.list;

  return (
    <ListsSectionLayout
      title={list?.name ?? tLists("detail.title")}
      description={list?.description ?? undefined}
      onBack={onBack}
    >
      <ListsListQueryBoundary listId={listId}>
        {(loadedList) => (
          <div className="grid gap-6">
            <ListsDetailMetadata list={loadedList} />
            {(canEditList(loadedList.role) || canDeleteList(loadedList.role)) && (
              <div className="flex flex-wrap gap-2">
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
            {canDeleteList(loadedList.role) && (
              <DeleteListDialog
                listId={listId}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onDeleted={onDelete}
              />
            )}
            <ListPoisSection listId={listId} />
          </div>
        )}
      </ListsListQueryBoundary>
    </ListsSectionLayout>
  );
}
