import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGenerateEditLink } from "../hooks/use-generate-edit-link";
import { useRevokeEditLink } from "../hooks/use-revoke-edit-link";
import { useShareList } from "../hooks/use-share-list";
import { useUnshareList } from "../hooks/use-unshare-list";

import { ShareListDialog } from "./share-list-dialog";

vi.mock("../hooks/use-share-list", () => ({
  useShareList: vi.fn(),
}));

vi.mock("../hooks/use-unshare-list", () => ({
  useUnshareList: vi.fn(),
}));

vi.mock("../hooks/use-generate-edit-link", () => ({
  useGenerateEditLink: vi.fn(),
}));

vi.mock("../hooks/use-revoke-edit-link", () => ({
  useRevokeEditLink: vi.fn(),
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

function mockMutation(mutateAsync: ReturnType<typeof vi.fn>) {
  return { mutateAsync, isPending: false };
}

describe("ShareListDialog", () => {
  const onOpenChange = vi.fn();
  const shareList = vi.fn();
  const unshareList = vi.fn();
  const generateEditLink = vi.fn();
  const revokeEditLink = vi.fn();
  const writeText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    shareList.mockResolvedValue({ shareLink: "https://example.com/shared/new-token" });
    unshareList.mockResolvedValue({ message: "ok" });
    generateEditLink.mockResolvedValue({
      editLink: "https://example.com/list/list-1/join?editToken=new-edit",
    });
    revokeEditLink.mockResolvedValue({ message: "ok" });
    writeText.mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    vi.mocked(useShareList).mockReturnValue(
      mockMutation(shareList) as unknown as ReturnType<typeof useShareList>
    );
    vi.mocked(useUnshareList).mockReturnValue(
      mockMutation(unshareList) as unknown as ReturnType<typeof useUnshareList>
    );
    vi.mocked(useGenerateEditLink).mockReturnValue(
      mockMutation(generateEditLink) as unknown as ReturnType<typeof useGenerateEditLink>
    );
    vi.mocked(useRevokeEditLink).mockReturnValue(
      mockMutation(revokeEditLink) as unknown as ReturnType<typeof useRevokeEditLink>
    );
  });

  it("generates a read link when none exists", async () => {
    const user = userEvent.setup();

    render(
      <ShareListDialog
        listId="list-1"
        shareToken={null}
        editToken={null}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "share.readLink.generate" }));

    expect(shareList).toHaveBeenCalledWith({ listId: "list-1" });
    expect(screen.getByDisplayValue("https://example.com/shared/new-token")).toBeInTheDocument();
  });

  it("generates an edit link when none exists", async () => {
    const user = userEvent.setup();

    render(
      <ShareListDialog
        listId="list-1"
        shareToken={null}
        editToken={null}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "share.editLink.generate" }));

    expect(generateEditLink).toHaveBeenCalledWith({ listId: "list-1" });
    expect(
      screen.getByDisplayValue("https://example.com/list/list-1/join?editToken=new-edit")
    ).toBeInTheDocument();
  });

  it("copies an existing read link", async () => {
    const user = userEvent.setup();
    const expectedUrl = `${window.location.origin}/shared/abc123`;

    render(
      <ShareListDialog
        listId="list-1"
        shareToken="abc123"
        editToken={null}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "share.readLink.copy" }));

    expect(writeText).toHaveBeenCalledWith(expectedUrl);
    expect(toast.success).toHaveBeenCalledWith("share.copySuccess");
  });

  it("revokes a read link after inline confirmation", async () => {
    const user = userEvent.setup();

    render(
      <ShareListDialog
        listId="list-1"
        shareToken="abc123"
        editToken={null}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "share.readLink.revoke" }));
    expect(unshareList).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "share.readLink.revokeConfirm" }));

    expect(unshareList).toHaveBeenCalledWith({ listId: "list-1" });
    expect(toast.success).toHaveBeenCalledWith("share.revokeSuccess");
    expect(screen.getByText("share.readLink.empty")).toBeInTheDocument();
  });

  it("revokes an edit link after inline confirmation", async () => {
    const user = userEvent.setup();

    render(
      <ShareListDialog
        listId="list-1"
        shareToken={null}
        editToken="edit-1"
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "share.editLink.revoke" }));
    await user.click(screen.getByRole("button", { name: "share.editLink.revokeConfirm" }));

    expect(revokeEditLink).toHaveBeenCalledWith({ listId: "list-1" });
    expect(toast.success).toHaveBeenCalledWith("share.revokeSuccess");
    expect(screen.getByText("share.editLink.empty")).toBeInTheDocument();
  });
});
