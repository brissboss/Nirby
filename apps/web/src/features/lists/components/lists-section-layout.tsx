"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/components/ui";

type ListsSubViewHeaderProps = {
  title: string;
  description?: string;
  onBack: () => void;
};

function ListsSubViewHeader({ title, description, onBack }: ListsSubViewHeaderProps) {
  const t = useTranslations();

  return (
    <header className="grid gap-2 pb-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("common.buttons.back")}
      </Button>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </header>
  );
}

export type ListsSectionLayoutProps = {
  title: string;
  description?: string;
  onBack: () => void;
  children: ReactNode;
};

/**
 * Standard shell layout for list sub-views (create, detail, …).
 * Back control + title + body with consistent spacing.
 */
export function ListsSectionLayout({
  title,
  description,
  onBack,
  children,
}: ListsSectionLayoutProps) {
  return (
    <div className="grid gap-4 pb-4">
      <ListsSubViewHeader title={title} description={description} onBack={onBack} />
      {children}
    </div>
  );
}
