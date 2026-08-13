import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateCollaboratorRole } from "./use-update-collaborator-role";

import { updateCollaboratorRole } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  updateCollaboratorRole: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof updateCollaboratorRole>>;
}

describe("useUpdateCollaboratorRole", () => {
  let queryClient: QueryClient;
  const input = {
    listId: "list-1",
    collaboratorId: "collab-1",
    body: { role: "ADMIN" as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls updateCollaboratorRole and returns data on success", async () => {
    const data = { message: "Collaborator role updated successfully" };
    vi.mocked(updateCollaboratorRole).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useUpdateCollaboratorRole(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(updateCollaboratorRole).toHaveBeenCalledWith({
      path: { listId: "list-1", collaboratorId: "collab-1" },
      body: input.body,
    });
    expect(resolved).toEqual(data);
  });

  it("invalidates collaborator and list caches on success", async () => {
    vi.mocked(updateCollaboratorRole).mockResolvedValue(
      apiResponse({ data: { message: "Collaborator role updated successfully" } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateCollaboratorRole(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.lists.collaborators.all("list-1"),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.detail("list-1") });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.all });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Forbidden" };
    vi.mocked(updateCollaboratorRole).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useUpdateCollaboratorRole(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync(input);
      })
    ).rejects.toEqual(apiError);
  });
});
