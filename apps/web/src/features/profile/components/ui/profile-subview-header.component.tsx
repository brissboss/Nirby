"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui";

type ProfileSubViewHeaderProps = {
  title: string;
  description?: string;
  onBack: () => void;
};

export function ProfileSubViewHeader({ title, description, onBack }: ProfileSubViewHeaderProps) {
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
