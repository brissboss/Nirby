"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { useList } from "../hooks/use-list";

import { Button } from "@/components/ui";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { ListWithRole } from "@/lib/api";
import { getErrorCode } from "@/lib/api/errors";

type ListsListQueryBoundaryProps = {
  listId: string;
  children: (list: ListWithRole) => ReactNode;
};

/**
 * Loads a list by id and renders loading / error / success states shared by detail and edit views.
 */
export function ListsListQueryBoundary({ listId, children }: ListsListQueryBoundaryProps) {
  const tLists = useTranslations("lists");
  const getErrorMessage = useErrorMessage();
  const { data, isPending, isError, error, refetch } = useList(listId);

  const list = data?.list;
  const isNotFound = isError && getErrorCode(error) === "LIST_NOT_FOUND";

  if (isPending) {
    return <p className="text-sm text-muted-foreground">{tLists("detail.loading")}</p>;
  }

  if (isError) {
    return (
      <div className="grid gap-3 py-4" role="alert">
        <p className="text-sm text-muted-foreground">
          {isNotFound ? tLists("detail.notFound") : getErrorMessage(error)}
        </p>
        {!isNotFound && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => refetch()}
          >
            {tLists("index.error.retry")}
          </Button>
        )}
      </div>
    );
  }

  if (!list) {
    return null;
  }

  return <>{children(list)}</>;
}
