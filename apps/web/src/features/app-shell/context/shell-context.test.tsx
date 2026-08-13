import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}));

import { EXPLORE_SEARCH_DEBOUNCE_MS } from "../constants/shell.constants";

import { ShellProvider, useShell } from "./shell-context";

function renderShell() {
  return renderHook(() => useShell(), { wrapper: ShellProvider });
}

describe("ShellProvider search", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    replace.mockImplementation((href: string) => {
      searchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    searchParams = new URLSearchParams("view=lists&mapMode=1");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("switches to explore and exits map mode when the query reaches the min length", () => {
    const { result, rerender } = renderShell();

    act(() => {
      result.current.setSearchDraft("caf");
    });
    act(() => {
      vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS);
    });
    rerender();

    expect(replace).toHaveBeenCalledWith("/?q=caf", { scroll: false });
    expect(result.current.query).toBe("caf");
    expect(result.current.view).toBe("explore");
    expect(result.current.mapMode).toBe(false);
  });

  it("keeps the current view for a query below the min length", () => {
    const { result, rerender } = renderShell();

    act(() => {
      result.current.setSearchDraft("c");
    });
    act(() => {
      vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS);
    });
    rerender();

    expect(result.current.query).toBe("c");
    expect(result.current.view).toBe("lists");
    expect(result.current.mapMode).toBe(true);
  });

  it("adopts an external query change into the draft", () => {
    const { result, rerender } = renderShell();

    act(() => {
      result.current.setSearchDraft("café");
    });
    act(() => {
      vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS);
    });
    rerender();

    // Browser back / deep link: the URL changes without going through the shell.
    searchParams = new URLSearchParams("q=caf");
    rerender();

    expect(result.current.query).toBe("caf");
    expect(result.current.searchDraft).toBe("caf");
  });

  it("commits immediately when the query is set programmatically", () => {
    const { result } = renderShell();

    act(() => {
      result.current.setQuery("  café  ");
    });

    expect(result.current.searchDraft).toBe("café");
    expect(replace).toHaveBeenCalledWith("/?q=caf%C3%A9", { scroll: false });
  });
});
