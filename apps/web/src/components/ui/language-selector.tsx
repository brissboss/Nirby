"use client";

import { GlobeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

import { setLocale } from "@/lib/i18n";

export function LanguageSelector({ type = "icon" }: { type?: "icon" | "text" | "icon-text" }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (newLocale: "fr" | "en") => {
    if (newLocale === locale) return;

    setIsChanging(true);
    try {
      await setLocale(newLocale);
      router.refresh();
    } catch {
      // Silent error
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isChanging}>
          {type === "icon" && <GlobeIcon className="w-4 h-4" />}
          {type === "text" && <span>{t("common.language")}</span>}
          {type === "icon-text" && (
            <>
              <GlobeIcon className="w-4 h-4" />
              <span>{t("common.language")}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange("en")} disabled={locale === "en"}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange("fr")} disabled={locale === "fr"}>
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
