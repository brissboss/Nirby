"use client";

import { useTranslations } from "next-intl";

import { SHELL_VIEWS } from "../../constants/shell.constants";
import type { ShellView } from "../../types/shell.types";

import { cn } from "@/lib/utils";

type ViewTabsProps = {
  value: ShellView;
  onChange: (view: ShellView) => void;
  mobile?: boolean;
};

export function ViewTabs({ value, onChange, mobile = false }: ViewTabsProps) {
  const t = useTranslations("shell");

  return (
    <nav className={cn("grid grid-cols-3 gap-2 px-4 pb-4", mobile && "px-0 pb-0")}>
      {SHELL_VIEWS.map((item) => {
        const Icon = item.icon;
        const isActive = value === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            <span>{t(`tabs.${item.id}`)}</span>
          </button>
        );
      })}
    </nav>
  );
}
