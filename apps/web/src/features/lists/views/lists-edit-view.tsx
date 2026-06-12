"use client";

import { useTranslations } from "next-intl";

import { ListsListQueryBoundary } from "../components/lists-list-query-boundary";
import { ListsSectionLayout } from "../components/lists-section-layout";
import { canEditList } from "../constants/lists.constants";
import { EditListForm } from "../forms/edit-list-form";
import { listToFormValues } from "../utils/list-form.utils";

type ListsEditViewProps = {
  listId: string;
  onBack: () => void;
};

export function ListsEditView({ listId, onBack }: ListsEditViewProps) {
  const tLists = useTranslations("lists");

  return (
    <ListsSectionLayout title={tLists("edit.title")} onBack={onBack}>
      <ListsListQueryBoundary listId={listId}>
        {(list) =>
          canEditList(list.role) ? (
            <EditListForm
              listId={listId}
              embedded
              defaultValues={listToFormValues(list)}
              onUpdated={onBack}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{tLists("edit.readOnly")}</p>
          )
        }
      </ListsListQueryBoundary>
    </ListsSectionLayout>
  );
}
