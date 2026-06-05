import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}));

import { useListSectionUrl } from "./use-list-section-url";

function useTestHarness(initialListId: string | null = null) {
  const [listId, setListIdState] = useState(initialListId);
  const { setListId } = useListSectionUrl(listId, setListIdState);
  return { listId, setListId };
}

describe("useListSectionUrl", () => {
  beforeEach(() => {
    push.mockClear();
    push.mockImplementation((href: string) => {
      const query = href.includes("?") ? href.split("?")[1] : "";
      searchParams = new URLSearchParams(query);
    });
    searchParams = new URLSearchParams();
  });

  it("pushes detail URL when setListId is called with an id", async () => {
    const { result } = renderHook(() => useTestHarness(null));

    act(() => {
      result.current.setListId("abc-123");
    });

    expect(push).toHaveBeenCalledWith("/?view=lists&listId=abc-123", { scroll: false });
    await waitFor(() => {
      expect(result.current.listId).toBe("abc-123");
    });
  });

  it("pushes index URL when setListId is called with null", async () => {
    searchParams = new URLSearchParams("view=lists&listId=abc-123");
    const { result } = renderHook(() => useTestHarness("abc-123"));

    act(() => {
      result.current.setListId(null);
    });

    expect(push).toHaveBeenCalledWith("/?view=lists", { scroll: false });
    await waitFor(() => {
      expect(result.current.listId).toBe(null);
    });
  });

  it("does not push when setListId is called with the same value", async () => {
    searchParams = new URLSearchParams("view=lists&listId=abc-123");
    const { result } = renderHook(() => useTestHarness("abc-123"));

    await waitFor(() => {
      expect(result.current.listId).toBe("abc-123");
    });

    act(() => {
      result.current.setListId("abc-123");
    });

    expect(push).not.toHaveBeenCalled();
  });

  it("syncs listId from URL on mount (deep-link)", async () => {
    searchParams = new URLSearchParams("view=lists&listId=deep-link-id");
    const { result } = renderHook(() => useTestHarness(null));

    await waitFor(() => {
      expect(result.current.listId).toBe("deep-link-id");
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("syncs listId to null when listId param is removed from URL", async () => {
    searchParams = new URLSearchParams("view=lists&listId=abc-123");
    const { result, rerender } = renderHook(() => useTestHarness("abc-123"));

    searchParams = new URLSearchParams("view=lists");
    rerender();

    await waitFor(() => {
      expect(result.current.listId).toBe(null);
    });
    expect(push).not.toHaveBeenCalled();
  });
});
