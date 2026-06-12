import { useTranslations } from "next-intl";

import { Logo } from "@/components/logo";

export function ShellHeader() {
  const t = useTranslations("shell");

  return (
    <header className="px-5 pb-3 pt-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center bg-muted rounded-lg">
            <Logo className="size-8" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight">Nirby</p>
            <p className="text-sm text-muted-foreground">{t("header.tagline")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
