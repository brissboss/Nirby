"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { buildListsNavigationSearchParams } from "../constants/lists.constants";
import { useJoinListByInvite } from "../hooks/use-join-list-by-invite";

import { JoinFlowView } from "./join-flow-view";

import { useAuth } from "@/features/auth";

type AcceptInviteViewProps = {
  listId: string;
  token: string | null;
  returnPath: string;
};

export function AcceptInviteView({ listId, token, returnPath }: AcceptInviteViewProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { mutate, error, isPending, isError } = useJoinListByInvite();
  const didJoin = useRef(false);
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    if (!isAuthenticated || !token || didJoin.current) {
      return;
    }
    didJoin.current = true;
    mutate(
      { listId, token },
      {
        onSuccess: (data) => {
          router.push(`/${buildListsNavigationSearchParams(new URLSearchParams(), data.list.id)}`);
        },
      }
    );
  }, [isAuthenticated, listId, mutate, router, token]);

  return (
    <JoinFlowView
      mode="accept"
      returnPath={returnPath}
      token={token}
      isAuthLoading={isLoading}
      isAuthenticated={isAuthenticated}
      isJoining={isPending}
      error={isError ? error : null}
    />
  );
}
