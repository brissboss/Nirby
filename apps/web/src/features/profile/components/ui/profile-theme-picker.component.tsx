"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button, Label } from "@/components/ui";

export function ProfileThemePicker() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-2">
      <Label>{t("common.theme.title")}</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={theme === "light" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("light")}
        >
          <Sun />
          {t("common.theme.light")}
        </Button>
        <Button
          type="button"
          variant={theme === "dark" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("dark")}
        >
          <Moon />
          {t("common.theme.dark")}
        </Button>
        <Button
          type="button"
          variant={theme === "system" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("system")}
        >
          <Monitor />
          {t("common.theme.system")}
        </Button>
      </div>
    </div>
  );
}
