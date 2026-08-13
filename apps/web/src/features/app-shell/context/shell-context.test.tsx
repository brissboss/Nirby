import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, prefetch: vi.fn(), back: vi.fn() }),
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

describe("ShellProvider POI selection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    push.mockClear();
    replace.mockImplementation((href: string) => {
      searchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    push.mockImplementation((href: string) => {
      searchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    searchParams = new URLSearchParams("view=lists");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("selectPoi stores the id and enters map mode", () => {
    const { result } = renderShell();

    act(() => {
      result.current.selectPoi("poi-1");
    });

    expect(result.current.selectedPoiId).toBe("poi-1");
    expect(result.current.mapMode).toBe(true);
  });

  it("clearSelection resets the id and exits map mode", () => {
    const { result } = renderShell();

    act(() => {
      result.current.selectPoi("poi-1");
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedPoiId).toBeNull();
    expect(result.current.mapMode).toBe(false);
  });

  it("clears selection when exiting map mode from the active tab", () => {
    searchParams = new URLSearchParams("view=lists&mapMode=1");
    const { result, rerender } = renderShell();
    rerender();

    act(() => {
      result.current.selectPoi("poi-1");
    });

    act(() => {
      result.current.setViewAndExitMapMode("lists");
    });

    expect(result.current.selectedPoiId).toBeNull();
    expect(result.current.mapMode).toBe(false);
  });

  it("clears selection when the search query changes", () => {
    const { result, rerender } = renderShell();

    act(() => {
      result.current.selectPoi("poi-1");
    });

    act(() => {
      result.current.setSearchDraft("caf");
    });
    act(() => {
      vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS);
    });
    rerender();

    expect(result.current.selectedPoiId).toBeNull();
  });

  it("clears selection when switching shell views", () => {
    const { result } = renderShell();

    act(() => {
      result.current.selectPoi("poi-1");
    });
    act(() => {
      result.current.setView("explore");
    });

    expect(result.current.selectedPoiId).toBeNull();
  });
});
