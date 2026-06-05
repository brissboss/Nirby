"use client";

import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { ListsDetailMetadata } from "../components/lists-detail-metadata";
import { ListsListQueryBoundary } from "../components/lists-list-query-boundary";
import { ListsSectionLayout } from "../components/lists-section-layout";
import { canEditList } from "../constants/lists.constants";
import { useList } from "../hooks/use-list";

import { Button } from "@/components/ui";

type ListsDetailViewProps = {
  listId: string;
  onBack: () => void;
  onEdit: () => void;
};

export function ListsDetailView({ listId, onBack, onEdit }: ListsDetailViewProps) {
  const tLists = useTranslations("lists");
  const { data } = useList(listId);
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

            {canEditList(loadedList.role) && (
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onEdit}>
                <PencilIcon className="size-4" />
                {tLists("edit.action")}
              </Button>
            )}

            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">{tLists("detail.poisComingSoon")}</p>
            </div>
          </div>
        )}
      </ListsListQueryBoundary>
    </ListsSectionLayout>
  );
}
