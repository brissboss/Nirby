"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { buildListsNavigationSearchParams } from "../constants/lists.constants";
import { useJoinListByEditLink } from "../hooks/use-join-list-by-edit-link";

import { JoinFlowView } from "./join-flow-view";

import { useAuth } from "@/features/auth";

type JoinListViewProps = {
  editToken: string | null;
  returnPath: string;
};

export function JoinListView({ editToken, returnPath }: JoinListViewProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { mutate, error, isPending, isError } = useJoinListByEditLink();
  const didJoin = useRef(false);
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    if (!isAuthenticated || !editToken || didJoin.current) {
      return;
    }
    didJoin.current = true;
    mutate(
      { editToken },
      {
        onSuccess: (data) => {
          router.push(`/${buildListsNavigationSearchParams(new URLSearchParams(), data.list.id)}`);
        },
      }
    );
  }, [editToken, isAuthenticated, mutate, router]);

  return (
    <JoinFlowView
      mode="edit"
      returnPath={returnPath}
      token={editToken}
      isAuthLoading={isLoading}
      isAuthenticated={isAuthenticated}
      isJoining={isPending}
      error={isError ? error : null}
    />
  );
}
