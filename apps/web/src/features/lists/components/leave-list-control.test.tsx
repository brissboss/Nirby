import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLeaveList } from "../hooks/use-leave-list";

import { LeaveListControl } from "./leave-list-control";

import { getErrorCode } from "@/lib/api/errors";

vi.mock("../hooks/use-leave-list", () => ({
  useLeaveList: vi.fn(),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("@/lib/api/errors", () => ({
  getErrorCode: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LeaveListControl", () => {
  const onLeft = vi.fn();
  const leaveMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getErrorCode).mockReturnValue(null);
    leaveMutate.mockResolvedValue({ message: "ok" });
    vi.mocked(useLeaveList).mockReturnValue({
      mutateAsync: leaveMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLeaveList>);
  });

  it("leaves the list after confirmation, toasts, and calls onLeft", async () => {
    const user = userEvent.setup();
    render(<LeaveListControl listId="list-1" onLeft={onLeft} />);

    await user.click(screen.getByRole("button", { name: "collaborators.leave" }));
    await user.click(screen.getByRole("button", { name: "collaborators.leaveConfirm" }));

    expect(leaveMutate).toHaveBeenCalledWith({ listId: "list-1" });
    expect(toast.success).toHaveBeenCalledWith("collaborators.leaveSuccess");
    expect(onLeft).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when leave fails", async () => {
    const user = userEvent.setup();
    leaveMutate.mockRejectedValue(new Error("LIST_OWNER_CANNOT_LEAVE"));
    vi.mocked(getErrorCode).mockReturnValue("LIST_OWNER_CANNOT_LEAVE");
    render(<LeaveListControl listId="list-1" onLeft={onLeft} />);

    await user.click(screen.getByRole("button", { name: "collaborators.leave" }));
    await user.click(screen.getByRole("button", { name: "collaborators.leaveConfirm" }));

    expect(toast.error).toHaveBeenCalledWith("collaborators.leaveError", {
      description: "API error message",
    });
    expect(onLeft).not.toHaveBeenCalled();
  });
});
