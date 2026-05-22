"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button, Label } from "@/components/ui";
import { setLocale } from "@/lib/i18n";

export function ProfileLanguagePicker() {
  const t = useTranslations();
  const locale = useLocale();

  const handleLanguageChange = async (newLocale: "fr" | "en") => {
    if (newLocale === locale) return;
    try {
      await setLocale(newLocale);
    } catch {
      // ignore
    }
  };

  return (
    <div className="grid gap-2">
      <Label>{t("common.language")}</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={locale === "fr" ? "default" : "outline"}
          size="sm"
          onClick={() => handleLanguageChange("fr")}
        >
          Français
        </Button>
        <Button
          type="button"
          variant={locale === "en" ? "default" : "outline"}
          size="sm"
          onClick={() => handleLanguageChange("en")}
        >
          English
        </Button>
      </div>
    </div>
  );
}
