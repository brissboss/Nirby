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
 * - **State → URL:** `setValueAndPush` updates state right away — so the UI reacts
 *   instantly — then calls `router.push` with `scroll: false`.
 * - **URL → state:** When `searchParams` changes, parses `param` and updates local state
 *   if it differs (browser back/forward, deep link). URL values observed while one of our
 *   own pushes is still in flight are ignored, otherwise the previous value would flash
 *   back before the new URL commits.
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
  const valueRef = useRef(value);
  /** Value we pushed and are waiting for in the URL, or `null` when nothing is in flight. */
  const pendingValueRef = useRef<{ value: T } | null>(null);

  useLayoutEffect(() => {
    valueRef.current = value;
  });

  useEffect(() => {
    const fromUrl = parse(searchParams.get(param));
    const pending = pendingValueRef.current;

    if (pending !== null) {
      // `router.push` is asynchronous: until it commits, `searchParams` still holds the
      // previous value. Adopting it here would flash the previous view on every render
      // that happens in between (and again once the URL lands).
      if (Object.is(fromUrl, pending.value) || Object.is(fromUrl, valueRef.current)) {
        pendingValueRef.current = null;
      }
      return;
    }

    if (!Object.is(fromUrl, valueRef.current)) {
      setValue(fromUrl);
    }
  }, [searchParams, param, parse, setValue]);

  const setValueAndPush = useCallback(
    (next: T) => {
      if (Object.is(next, valueRef.current)) {
        return;
      }

      pendingValueRef.current = { value: next };
      setValue(next);
      const qs = buildHref(searchParams, next);
      router.push(`${pathname}${qs}`, { scroll: false });
    },
    [pathname, router, searchParams, setValue, buildHref]
  );

  return { setValueAndPush };
}
