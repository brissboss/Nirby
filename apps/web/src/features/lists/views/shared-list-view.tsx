"use client";

import { useTranslations } from "next-intl";

import { SharedListPoisSection } from "../components/shared-list-pois-section";
import { useSharedList } from "../hooks/use-shared-list";

import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";
import { useErrorMessage } from "@/hooks/use-error-message";
import { getErrorCode } from "@/lib/api/errors";

type SharedListViewProps = {
  shareToken: string;
};

function creatorInitial(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

export function SharedListView({ shareToken }: SharedListViewProps) {
  const tLists = useTranslations("lists");
  const getErrorMessage = useErrorMessage();
  const { data, isPending, isError, error, refetch } = useSharedList(shareToken);

  const list = data?.list;
  const errorCode = isError ? getErrorCode(error) : null;
  const isNotFound = errorCode === "LIST_NOT_FOUND";
  const isExpired = errorCode === "SHARE_TOKEN_EXPIRED";

  if (isPending) {
    return <p className="text-sm text-muted-foreground">{tLists("shared.loading")}</p>;
  }

  if (isError) {
    return (
      <div className="grid gap-3 py-4" role="alert">
        <p className="text-sm text-muted-foreground">
          {isNotFound
            ? tLists("shared.notFound")
            : isExpired
              ? tLists("shared.expired")
              : getErrorMessage(error)}
        </p>
        {!isNotFound && !isExpired ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => refetch()}
          >
            {tLists("shared.error.retry")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (!list) {
    return null;
  }

  const creatorName = list.creator?.name?.trim() || null;
  const creatorAvatarUrl = list.creator?.avatarUrl;

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {list.name?.trim() || tLists("shared.title")}
        </h1>
        {list.description?.trim() ? (
          <p className="text-sm text-muted-foreground">{list.description}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <Avatar>
            {creatorAvatarUrl ? <AvatarImage src={creatorAvatarUrl} alt="" /> : null}
            <AvatarFallback>{creatorInitial(creatorName)}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            {creatorName
              ? tLists("shared.creator.by", { name: creatorName })
              : tLists("shared.creator.unknown")}
          </p>
        </div>
      </header>
      <SharedListPoisSection shareToken={shareToken} />
    </div>
  );
}
