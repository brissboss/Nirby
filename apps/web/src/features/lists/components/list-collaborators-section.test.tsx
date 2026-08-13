import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCollaborators } from "../hooks/use-collaborators";
import { useInviteCollaborator } from "../hooks/use-invite-collaborator";
import { useLeaveList } from "../hooks/use-leave-list";
import { useRemoveCollaborator } from "../hooks/use-remove-collaborator";
import { useUpdateCollaboratorRole } from "../hooks/use-update-collaborator-role";

import { ListCollaboratorsSection } from "./list-collaborators-section";

import type { ListRole } from "@/features/lists/constants/lists.constants";
import type { Collaborator } from "@/lib/api";
import { getErrorCode } from "@/lib/api/errors";

const useAuth = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("../hooks/use-collaborators", () => ({
  useCollaborators: vi.fn(),
  COLLABORATORS_PAGE_SIZE: 20,
}));

vi.mock("../hooks/use-invite-collaborator", () => ({
  useInviteCollaborator: vi.fn(),
}));

vi.mock("../hooks/use-update-collaborator-role", () => ({
  useUpdateCollaboratorRole: vi.fn(),
}));

vi.mock("../hooks/use-remove-collaborator", () => ({
  useRemoveCollaborator: vi.fn(),
}));

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

const ownerUser = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada",
  avatarUrl: null,
  emailVerified: true,
};

const otherCollaborator: Collaborator = {
  role: "EDITOR",
  joinedAt: "2024-02-01T00:00:00.000Z",
  user: {
    id: "user-2",
    email: "alex@example.com",
    name: "Alex",
    avatarUrl: null,
  },
};

const selfAsAdmin: Collaborator = {
  role: "ADMIN",
  joinedAt: "2024-01-15T00:00:00.000Z",
  user: {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada",
    avatarUrl: null,
  },
};

function mockCollaboratorsQuery(
  overrides: Partial<ReturnType<typeof useCollaborators>> = {},
  collaborators: Collaborator[] = [otherCollaborator]
) {
  vi.mocked(useCollaborators).mockReturnValue({
    data: {
      collaborators,
      pagination: { page: 1, limit: 20, total: collaborators.length, totalPages: 1 },
    },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useCollaborators>);
}

function renderSection(role: ListRole, onLeft = vi.fn()) {
  return {
    onLeft,
    ...render(
      <ListCollaboratorsSection listId="list-1" role={role} createdBy="user-1" onLeft={onLeft} />
    ),
  };
}

describe("ListCollaboratorsSection", () => {
  const inviteMutate = vi.fn();
  const updateRoleMutate = vi.fn();
  const removeMutate = vi.fn();
  const leaveMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: ownerUser });
    vi.mocked(getErrorCode).mockReturnValue(null);
    mockCollaboratorsQuery();
    inviteMutate.mockResolvedValue({ inviteLink: "https://example.com/invite", emailSent: true });
    updateRoleMutate.mockResolvedValue({ message: "ok" });
    removeMutate.mockResolvedValue({ message: "ok" });
    leaveMutate.mockResolvedValue({ message: "ok" });
    vi.mocked(useInviteCollaborator).mockReturnValue({
      mutateAsync: inviteMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useInviteCollaborator>);
    vi.mocked(useUpdateCollaboratorRole).mockReturnValue({
      mutateAsync: updateRoleMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCollaboratorRole>);
    vi.mocked(useRemoveCollaborator).mockReturnValue({
      mutateAsync: removeMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useRemoveCollaborator>);
    vi.mocked(useLeaveList).mockReturnValue({
      mutateAsync: leaveMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLeaveList>);
  });

  it("shows invite and remove for OWNER, without Leave", () => {
    renderSection("OWNER");

    expect(
      screen.getByRole("heading", { name: "collaborators.section.title" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "collaborators.invite.submit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "collaborators.remove" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "collaborators.leave" })).not.toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("role.OWNER")).toBeInTheDocument();
  });

  it("shows invite, remove, and Leave for ADMIN without inventing an owner row", () => {
    mockCollaboratorsQuery({}, [selfAsAdmin, otherCollaborator]);

    renderSection("ADMIN");

    expect(screen.getByRole("button", { name: "collaborators.invite.submit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "collaborators.remove" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "collaborators.leave" })).toBeInTheDocument();
    expect(screen.queryByText("role.OWNER")).not.toBeInTheDocument();
  });

  it("hides invite and remove for EDITOR and shows Leave", () => {
    renderSection("EDITOR");

    expect(
      screen.queryByRole("button", { name: "collaborators.invite.submit" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "collaborators.remove" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "collaborators.leave" })).toBeInTheDocument();
  });

  it("hides invite and remove for VIEWER and shows Leave", () => {
    renderSection("VIEWER");

    expect(
      screen.queryByRole("button", { name: "collaborators.invite.submit" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "collaborators.remove" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "collaborators.leave" })).toBeInTheDocument();
  });

  it("invites a collaborator and shows a success toast", async () => {
    const user = userEvent.setup();
    renderSection("OWNER");

    await user.type(screen.getByLabelText("collaborators.invite.email"), "sam@example.com");
    await user.click(screen.getByRole("button", { name: "collaborators.invite.submit" }));

    expect(inviteMutate).toHaveBeenCalledWith({
      listId: "list-1",
      body: {
        email: "sam@example.com",
        role: "VIEWER",
        language: "en",
        sendEmail: true,
      },
    });
    expect(toast.success).toHaveBeenCalledWith("collaborators.invite.success");
  });

  it("shows an error toast when invite fails", async () => {
    const user = userEvent.setup();
    inviteMutate.mockRejectedValue({ error: { code: "COLLABORATOR_ALREADY_EXISTS" } });
    renderSection("OWNER");

    await user.type(screen.getByLabelText("collaborators.invite.email"), "sam@example.com");
    await user.click(screen.getByRole("button", { name: "collaborators.invite.submit" }));

    expect(toast.error).toHaveBeenCalledWith("collaborators.invite.error", {
      description: "API error message",
    });
  });

  it("removes a collaborator after confirmation and shows a success toast", async () => {
    const user = userEvent.setup();
    renderSection("OWNER");

    await user.click(screen.getByRole("button", { name: "collaborators.remove" }));
    await user.click(screen.getByRole("button", { name: "collaborators.removeConfirm" }));

    expect(removeMutate).toHaveBeenCalledWith({ listId: "list-1", collaboratorId: "user-2" });
    expect(toast.success).toHaveBeenCalledWith("collaborators.removeSuccess");
  });

  it("leaves the list after confirmation, toasts, and calls onLeft", async () => {
    const user = userEvent.setup();
    const { onLeft } = renderSection("EDITOR");

    await user.click(screen.getByRole("button", { name: "collaborators.leave" }));
    await user.click(screen.getByRole("button", { name: "collaborators.leaveConfirm" }));

    expect(leaveMutate).toHaveBeenCalledWith({ listId: "list-1" });
    expect(toast.success).toHaveBeenCalledWith("collaborators.leaveSuccess");
    expect(onLeft).toHaveBeenCalledTimes(1);
  });
});
