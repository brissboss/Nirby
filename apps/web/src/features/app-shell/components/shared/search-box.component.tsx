"use client";

import { Search, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { useShell } from "../../context/shell-context";

import { Button, Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

type SearchBoxProps = {
  compact?: boolean;
};

/**
 * Global search field, rendered on every shell view.
 *
 * Input state lives in {@link useShell} so the desktop and mobile instances — both mounted
 * at once — stay in sync and only commit one query.
 */
export function SearchBox({ compact = false }: SearchBoxProps) {
  const tExplore = useTranslations("explore");
  const { searchDraft, setSearchDraft, setQuery } = useShell();

  return (
    <Card
      className={cn(
        "mx-4 mb-4 flex-row items-center gap-3 bg-card/90 py-2",
        compact && "mx-0 mb-0 flex-1 px-3 py-2.5"
      )}
    >
      <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <Input
          type="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder={tExplore("search.placeholder")}
          aria-label={tExplore("search.ariaLabel")}
          className={cn(
            "text-md! h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 rounded-none",
            "[&::-webkit-search-cancel-button]:appearance-none",
            compact && "h-8"
          )}
        />
      </div>
      {searchDraft && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={tExplore("search.clearAriaLabel")}
          onClick={() => setQuery("")}
        >
          <XIcon className="size-4" />
        </Button>
      )}
    </Card>
  );
}
