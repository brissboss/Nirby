"use client";

import { Map } from "lucide-react";
import { useTranslations } from "next-intl";

import { useShell } from "../../context/shell-context";

import { Button } from "@/components/ui";

export function MobileSheetHeader() {
  const { setMapMode } = useShell();
  const t = useTranslations("shell");

  return (
    <div className="sticky top-0 z-10 -mx-4 flex shrink-0 items-center justify-end px-4 pb-3 pt-2.5">
      <Button
        type="button"
        size="sm"
        className="h-8 rounded-full px-3 text-xs"
        onClick={() => setMapMode(true)}
      >
        <Map className="size-4" />
        {t("mapMode.showMap")}
      </Button>
    </div>
  );
}
