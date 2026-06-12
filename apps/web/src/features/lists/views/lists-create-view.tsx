"use client";

import { useTranslations } from "next-intl";

import { ListsSectionLayout } from "../components/lists-section-layout";
import { CreateListForm } from "../forms/create-list-form";

type ListsCreateViewProps = {
  onBack: () => void;
};

export function ListsCreateView({ onBack }: ListsCreateViewProps) {
  const tLists = useTranslations("lists");

  return (
    <ListsSectionLayout title={tLists("create.title")} onBack={onBack}>
      <CreateListForm embedded closeDialog={onBack} onCreated={() => onBack()} />
    </ListsSectionLayout>
  );
}
