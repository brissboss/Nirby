"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Options for {@link useUrlParamState}.
 *
 * @template T - Parsed state type (e.g. `ShellView`, `ProfileSection`).
 */
type UseUrlParamStateOptions<T> = {
  /** Query param name (e.g. `SHELL_VIEW_PARAM`). */
  param: string;
  /** Current React state value. */
  value: T;
  /** State setter from `useState`. */
  setValue: (value: T) => void;
  /**
   * Maps the raw query value to `T`. Called on URL changes (back/forward,
   * external navigation). Should apply defaults when the param is missing or invalid.
   */
  parse: (raw: string | null) => T;
  /**
   * Builds the query string to append to the pathname, including a leading `?`
   * or an empty string when there are no params.
   *
   * Feature-specific builders may also add/remove related params (e.g. clearing
   * `section` when leaving profile).
   */
  buildHref: (current: URLSearchParams, next: T) => string;
};

/**
 * Syncs React state with a single URL search param (Next.js App Router).
 *
 * - **URL → state:** When `searchParams` changes, parses `param` and updates
 *   local state if it differs (browser back/forward, deep link).
 * - **State → URL:** `setValueAndPush` updates state and calls `router.push` with
 *   `scroll: false`, unless the update came from a URL sync (avoids a push loop).
 *
 * Must run under `Suspense` because it uses `useSearchParams`.
 *
 * @template T - Parsed state type.
 * @param options - Param name, state, parser, and href builder.
 * @returns `setValueAndPush` — prefer this over calling `setValue` directly when
 *   navigation should update the URL.
 *
 * @example
 * ```ts
 * const [view, setView] = useState<ShellView>(DEFAULT_SHELL_VIEW);
 * const { setValueAndPush: setView } = useUrlParamState({
 *   param: SHELL_VIEW_PARAM,
 *   value: view,
 *   setValue: setView,
 *   parse: parseShellView,
 *   buildHref: buildShellViewSearchParams,
 * });
 * ```
 */
export function useUrlParamState<T>({
  param,
  value,
  setValue,
  parse,
  buildHref,
}: UseUrlParamStateOptions<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSyncingFromUrl = useRef(false);
  const valueRef = useRef(value);

  useLayoutEffect(() => {
    valueRef.current = value;
  });

  useEffect(() => {
    const fromUrl = parse(searchParams.get(param));
    if (fromUrl !== valueRef.current) {
      isSyncingFromUrl.current = true;
      setValue(fromUrl);
    } else {
      isSyncingFromUrl.current = false;
    }
  }, [searchParams, param, parse, setValue]);

  const setValueAndPush = useCallback(
    (next: T) => {
      if (isSyncingFromUrl.current) {
        isSyncingFromUrl.current = false;
        setValue(next);
        return;
      }

      if (Object.is(next, valueRef.current)) {
        return;
      }

      setValue(next);
      const qs = buildHref(searchParams, next);
      router.push(`${pathname}${qs}`, { scroll: false });
    },
    [pathname, router, searchParams, setValue, buildHref]
  );

  return { setValueAndPush };
}
