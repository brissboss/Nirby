import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInviteCollaborator } from "./use-invite-collaborator";

import { inviteCollaborator } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  inviteCollaborator: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof inviteCollaborator>>;
}

describe("useInviteCollaborator", () => {
  let queryClient: QueryClient;
  const input = {
    listId: "list-1",
    body: { email: "alex@example.com", role: "EDITOR" as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls inviteCollaborator and returns data on success", async () => {
    const data = { inviteLink: "https://example.com/accept?token=abc", emailSent: true };
    vi.mocked(inviteCollaborator).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useInviteCollaborator(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(inviteCollaborator).toHaveBeenCalledWith({
      path: { listId: "list-1" },
      body: input.body,
    });
    expect(resolved).toEqual(data);
  });

  it("invalidates collaborator and list caches on success", async () => {
    vi.mocked(inviteCollaborator).mockResolvedValue(
      apiResponse({ data: { inviteLink: "https://example.com/accept", emailSent: true } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useInviteCollaborator(), {
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
    vi.mocked(inviteCollaborator).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useInviteCollaborator(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync(input);
      })
    ).rejects.toEqual(apiError);
  });
});
