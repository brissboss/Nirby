import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditListForm } from "./edit-list-form";

import { useUpdateList } from "@/features/lists";

vi.mock("@/features/lists", () => ({
  useUpdateList: vi.fn(),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const defaultValues = {
  name: "Paris spots",
  description: "Favorites",
  visibility: "PRIVATE" as const,
};

describe("EditListForm", () => {
  const mutateAsync = vi.fn();
  const onUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({ list: { id: "list-1", name: "Paris spots" } });
    vi.mocked(useUpdateList).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateList>);
  });

  it("prefills the form and submits an update", async () => {
    const user = userEvent.setup();
    render(<EditListForm listId="list-1" defaultValues={defaultValues} onUpdated={onUpdated} />);

    expect(screen.getByLabelText("fields.name")).toHaveValue("Paris spots");
    expect(screen.getByLabelText("fields.description")).toHaveValue("Favorites");

    await user.clear(screen.getByLabelText("fields.name"));
    await user.type(screen.getByLabelText("fields.name"), "Lyon spots");
    await user.click(screen.getByRole("button", { name: "edit.submit" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        listId: "list-1",
        body: {
          name: "Lyon spots",
          description: "Favorites",
          visibility: "PRIVATE",
        },
      });
      expect(toast.success).toHaveBeenCalledWith("updateList.success");
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it("shows an error toast when update fails", async () => {
    mutateAsync.mockRejectedValue({ error: { code: "FORBIDDEN" } });
    const user = userEvent.setup();
    render(<EditListForm listId="list-1" defaultValues={defaultValues} onUpdated={onUpdated} />);

    await user.click(screen.getByRole("button", { name: "edit.submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("updateList.error", {
        description: "API error message",
      });
    });
    expect(onUpdated).not.toHaveBeenCalled();
  });
});
