import { Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

type SearchBoxProps = {
  compact?: boolean;
};

export function SearchBox({ compact = false }: SearchBoxProps) {
  const t = useTranslations("shell");

  return (
    <Card
      className={cn(
        "mx-4 mb-4 flex-row items-center gap-3 bg-card/90",
        compact && "mx-0 mb-0 flex-1 px-3 py-2.5"
      )}
    >
      <Search className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t("search.placeholder")}</p>
        {!compact && <p className="text-xs text-muted-foreground">{t("search.hint")}</p>}
      </div>
      {!compact && (
        <Button variant="ghost" size="icon-sm" aria-label={t("search.filtersAriaLabel")}>
          <SlidersHorizontal className="size-4" />
        </Button>
      )}
    </Card>
  );
}
