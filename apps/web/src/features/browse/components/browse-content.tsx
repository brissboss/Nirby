import { Loader2, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components";
import { Separator } from "@/components/ui";
import { SearchBar, SearchResults, UserLists, useSearchPlace } from "@/features/browse";

export function BrowseContent() {
  const t = useTranslations();
  const searchPlace = useSearchPlace();
  const { data: places, isPending, lastSearchQueryText, isSuccess } = searchPlace;

  const renderList = () => {
    if (isPending) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      );
    }

    if (places?.places?.length) {
      return <SearchResults />;
    }

    if (isSuccess && !places?.places?.length && lastSearchQueryText?.trim()) {
      return (
        <EmptyState
          title={t("common.emptyState.title")}
          description={t("common.emptyState.description", { searchQuery: lastSearchQueryText })}
          icon={<SearchIcon className="size-8" />}
        />
      );
    }
    return <UserLists />;
  };

  return (
    <div className="flex flex-col px-0 pt-2 md:pt-4 h-full">
      <div className="px-4 pb-4">
        <SearchBar searchPlace={searchPlace} />
      </div>
      <Separator className="my-0" />

      <div className="min-h-0 flex-1 overflow-y-auto">{renderList()}</div>
    </div>
  );
}
