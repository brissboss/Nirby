import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}));

import { useUrlParamState } from "./use-url-param-state";

function buildHref(current: URLSearchParams, next: string) {
  const params = new URLSearchParams(current.toString());

  if (next === "explore") {
    params.delete("view");
  } else {
    params.set("view", next);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function useTestParam() {
  const [value, setValue] = useState("explore");
  const { setValueAndPush } = useUrlParamState({
    param: "view",
    value,
    setValue,
    // Inline like the real consumers, so the identity changes on every render.
    parse: (raw) => raw ?? "explore",
    buildHref: (current, next) => buildHref(current, next),
  });

  return { value, setValueAndPush };
}

/** Simulates the App Router committing the pushed URL. */
function commitNavigation() {
  const lastHref = push.mock.calls.at(-1)?.[0] as string | undefined;
  searchParams = new URLSearchParams(lastHref?.split("?")[1] ?? "");
}

describe("useUrlParamState", () => {
  beforeEach(() => {
    push.mockClear();
    searchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("pushes the new value to the URL", () => {
    const { result } = renderHook(() => useTestParam());

    act(() => {
      result.current.setValueAndPush("lists");
    });

    expect(push).toHaveBeenCalledWith("/?view=lists", { scroll: false });
    expect(result.current.value).toBe("lists");
  });

  it("keeps the new value while the navigation is in flight", () => {
    const { result, rerender } = renderHook(() => useTestParam());

    act(() => {
      result.current.setValueAndPush("lists");
    });

    // Renders happening before the router commits the URL must not flash the old value.
    rerender();
    rerender();

    expect(result.current.value).toBe("lists");

    commitNavigation();
    rerender();

    expect(result.current.value).toBe("lists");
  });

  it("does not flash an intermediate value when two navigations overlap", () => {
    const { result, rerender } = renderHook(() => useTestParam());

    act(() => {
      result.current.setValueAndPush("lists");
    });
    act(() => {
      result.current.setValueAndPush("profile");
    });

    // The first navigation lands after the second one was requested.
    searchParams = new URLSearchParams("view=lists");
    rerender();

    expect(result.current.value).toBe("profile");

    searchParams = new URLSearchParams("view=profile");
    rerender();

    expect(result.current.value).toBe("profile");
  });

  it("adopts an external URL change (back/forward, deep link)", () => {
    const { result, rerender } = renderHook(() => useTestParam());

    searchParams = new URLSearchParams("view=profile");
    rerender();

    expect(result.current.value).toBe("profile");
    expect(push).not.toHaveBeenCalled();
  });

  it("still pushes after a URL sync", () => {
    const { result, rerender } = renderHook(() => useTestParam());

    searchParams = new URLSearchParams("view=profile");
    rerender();

    act(() => {
      result.current.setValueAndPush("lists");
    });

    expect(push).toHaveBeenCalledWith("/?view=lists", { scroll: false });
    expect(result.current.value).toBe("lists");
  });

  it("does not push when the value is unchanged", () => {
    const { result } = renderHook(() => useTestParam());

    act(() => {
      result.current.setValueAndPush("explore");
    });

    expect(push).not.toHaveBeenCalled();
  });
});
