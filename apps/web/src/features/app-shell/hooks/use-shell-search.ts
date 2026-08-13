"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  EXPLORE_SEARCH_DEBOUNCE_MS,
  buildShellQuerySearchParams,
  parseShellQuery,
} from "../constants/shell.constants";

import { EXPLORE_QUERY_PARAM } from "@/lib/navigation/search-params";

export type ShellSearch = {
  /** Committed search query, mirrored by `?q=`. Drives the Explore results. */
  query: string;
  /** Raw input value, shared by every mounted search box. */
  searchDraft: string;
  /** Updates the input; the query is committed once typing settles. */
  setSearchDraft: (value: string) => void;
  /** Commits a query right away (clear button, programmatic navigation). */
  setQuery: (value: string) => void;
};

/**
 * Global search state for the shell.
 *
 * `?q=` is the single source of truth for {@link ShellSearch.query}, so the desktop and
 * mobile search boxes — both mounted at once and toggled by CSS — can never disagree.
 * `searchDraft` holds the raw input and is committed with `router.replace` after
 * {@link EXPLORE_SEARCH_DEBOUNCE_MS}, keeping one history entry per search.
 *
 * Must run under `Suspense` because it reads `useSearchParams`.
 */
export function useShellSearch(): ShellSearch {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = parseShellQuery(searchParams.get(EXPLORE_QUERY_PARAM));

  const [searchDraft, setSearchDraftState] = useState(query);
  /** Query this hook last wrote, to tell our own navigations from external ones. */
  const [ownQuery, setOwnQuery] = useState(query);
  /** Last reconciled `query`, so an external change is adopted exactly once. */
  const [lastQuery, setLastQuery] = useState(query);

  // Adopting an external query (back/forward, deep link) during render rather than in an
  // effect: React re-renders before painting, so the input never shows a stale value.
  if (query !== lastQuery) {
    setLastQuery(query);

    if (query !== ownQuery) {
      setOwnQuery(query);
      setSearchDraftState(query);
    }
  }

  const commitQuery = useCallback(
    (next: string) => {
      if (next === ownQuery) {
        return;
      }

      setOwnQuery(next);
      router.replace(`${pathname}${buildShellQuerySearchParams(searchParams, next)}`, {
        scroll: false,
      });
    },
    [ownQuery, pathname, router, searchParams]
  );

  // Read lazily by the pending timer so it commits the current input with the current
  // router state, however much changed since the keystroke that scheduled it.
  const latest = useRef({ searchDraft, commitQuery });
  useLayoutEffect(() => {
    latest.current = { searchDraft, commitQuery };
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingCommit = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  useEffect(() => cancelPendingCommit, [cancelPendingCommit]);

  const setSearchDraft = useCallback(
    (next: string) => {
      setSearchDraftState(next);
      cancelPendingCommit();

      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        latest.current.commitQuery(latest.current.searchDraft.trim());
      }, EXPLORE_SEARCH_DEBOUNCE_MS);
    },
    [cancelPendingCommit]
  );

  const setQuery = useCallback(
    (next: string) => {
      cancelPendingCommit();
      const trimmed = next.trim();
      setSearchDraftState(trimmed);
      commitQuery(trimmed);
    },
    [cancelPendingCommit, commitQuery]
  );

  return { query, searchDraft, setSearchDraft, setQuery };
}
