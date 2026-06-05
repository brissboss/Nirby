"use client";

import { useTranslations } from "next-intl";

import { ListsSectionLayout } from "../components/lists-section-layout";
import { useList } from "../hooks/use-list";

type ListsDetailViewProps = {
  listId: string;
  onBack: () => void;
};

export function ListsDetailView({ listId, onBack }: ListsDetailViewProps) {
  const tLists = useTranslations("lists");
  const { data, isPending } = useList(listId);

  return (
    <ListsSectionLayout title={data?.list.name ?? tLists("detail.title")} onBack={onBack}>
      {isPending ? (
        <p className="text-sm text-muted-foreground">{tLists("detail.loading")}</p>
      ) : (
        <p className="text-sm text-muted-foreground"> {tLists("detail.poisComingSoon")}</p>
      )}
    </ListsSectionLayout>
  );
}
