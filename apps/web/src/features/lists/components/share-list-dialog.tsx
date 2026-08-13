"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import type { ListRole } from "../constants/lists.constants";
import { useGenerateEditLink } from "../hooks/use-generate-edit-link";
import { useRevokeEditLink } from "../hooks/use-revoke-edit-link";
import { useShareList } from "../hooks/use-share-list";
import { useUnshareList } from "../hooks/use-unshare-list";
import { buildEditLinkUrl, buildShareUrl } from "../utils/share-links.utils";

import { ListCollaboratorsSection } from "./list-collaborators-section";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Input,
} from "@/components/ui";
import { useErrorMessage } from "@/hooks/use-error-message";
import { useMediaQuery } from "@/hooks/use-media-query";

export type ShareListDialogProps = {
  listId: string;
  shareToken: string | null;
  editToken: string | null;
  role?: ListRole;
  createdBy: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type LinkKind = "read" | "edit";

/** Share dialog: Dialog on desktop, Drawer on mobile (same pattern as AddToListPicker). */
export function ShareListDialog(props: ShareListDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <ShareListDrawer {...props} /> : <ShareListDesktopDialog {...props} />;
}

function useShareListDialog({ listId, shareToken, editToken, onOpenChange }: ShareListDialogProps) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const getErrorMessage = useErrorMessage();
  const [shareUrlOverride, setShareUrlOverride] = useState<string | null>(null);
  const [editUrlOverride, setEditUrlOverride] = useState<string | null>(null);
  const [shareCleared, setShareCleared] = useState(false);
  const [editCleared, setEditCleared] = useState(false);
  const [confirming, setConfirming] = useState<LinkKind | null>(null);

  const { mutateAsync: shareList, isPending: isSharing } = useShareList();
  const { mutateAsync: unshareList, isPending: isUnsharing } = useUnshareList();
  const { mutateAsync: generateEditLink, isPending: isGeneratingEdit } = useGenerateEditLink();
  const { mutateAsync: revokeEditLink, isPending: isRevokingEdit } = useRevokeEditLink();

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const shareUrl = shareCleared
    ? null
    : (shareUrlOverride ?? (shareToken ? buildShareUrl(origin, shareToken) : null));
  const editUrl = editCleared
    ? null
    : (editUrlOverride ?? (editToken ? buildEditLinkUrl(origin, listId, editToken) : null));

  function resetLocalState() {
    setShareUrlOverride(null);
    setEditUrlOverride(null);
    setShareCleared(false);
    setEditCleared(false);
    setConfirming(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetLocalState();
    }
    onOpenChange(nextOpen);
  }

  async function handleGenerate(kind: LinkKind) {
    try {
      if (kind === "read") {
        const data = await shareList({ listId });
        setShareCleared(false);
        setShareUrlOverride(data.shareLink);
      } else {
        const data = await generateEditLink({ listId });
        setEditCleared(false);
        setEditUrlOverride(data.editLink);
      }
    } catch (error) {
      toast.error(tLists("share.generateError"), { description: getErrorMessage(error) });
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(tLists("share.copySuccess"));
    } catch {
      toast.error(tLists("share.copyError"));
    }
  }

  async function handleRevoke(kind: LinkKind) {
    try {
      if (kind === "read") {
        await unshareList({ listId });
        setShareUrlOverride(null);
        setShareCleared(true);
      } else {
        await revokeEditLink({ listId });
        setEditUrlOverride(null);
        setEditCleared(true);
      }
      setConfirming(null);
      toast.success(tLists("share.revokeSuccess"));
    } catch (error) {
      toast.error(tLists("share.revokeError"), { description: getErrorMessage(error) });
    }
  }

  return {
    tLists,
    tCommon,
    shareUrl,
    editUrl,
    confirming,
    setConfirming,
    isSharing,
    isUnsharing,
    isGeneratingEdit,
    isRevokingEdit,
    handleGenerate,
    handleCopy,
    handleRevoke,
    handleOpenChange,
  };
}

type ShareDialogState = ReturnType<typeof useShareListDialog>;

function ShareListBody({
  listId,
  role,
  createdBy,
  tLists,
  tCommon,
  shareUrl,
  editUrl,
  confirming,
  setConfirming,
  isSharing,
  isUnsharing,
  isGeneratingEdit,
  isRevokingEdit,
  handleGenerate,
  handleCopy,
  handleRevoke,
}: ShareDialogState & Pick<ShareListDialogProps, "listId" | "role" | "createdBy">) {
  return (
    <div className="grid max-h-[min(70vh,32rem)] gap-6 overflow-y-auto">
      <ShareLinkSection
        title={tLists("share.readLink.title")}
        description={tLists("share.readLink.description")}
        emptyLabel={tLists("share.readLink.empty")}
        generateLabel={tLists("share.readLink.generate")}
        copyLabel={tLists("share.readLink.copy")}
        revokeLabel={tLists("share.readLink.revoke")}
        revokeConfirmLabel={tLists("share.readLink.revokeConfirm")}
        cancelLabel={tCommon("buttons.cancel")}
        url={shareUrl}
        isGenerating={isSharing}
        isRevoking={isUnsharing}
        confirming={confirming === "read"}
        onGenerate={() => handleGenerate("read")}
        onCopy={() => shareUrl && handleCopy(shareUrl)}
        onRequestRevoke={() => setConfirming("read")}
        onCancelRevoke={() => setConfirming(null)}
        onConfirmRevoke={() => handleRevoke("read")}
      />
      <ShareLinkSection
        title={tLists("share.editLink.title")}
        description={tLists("share.editLink.description")}
        emptyLabel={tLists("share.editLink.empty")}
        generateLabel={tLists("share.editLink.generate")}
        copyLabel={tLists("share.editLink.copy")}
        revokeLabel={tLists("share.editLink.revoke")}
        revokeConfirmLabel={tLists("share.editLink.revokeConfirm")}
        cancelLabel={tCommon("buttons.cancel")}
        url={editUrl}
        isGenerating={isGeneratingEdit}
        isRevoking={isRevokingEdit}
        confirming={confirming === "edit"}
        onGenerate={() => handleGenerate("edit")}
        onCopy={() => editUrl && handleCopy(editUrl)}
        onRequestRevoke={() => setConfirming("edit")}
        onCancelRevoke={() => setConfirming(null)}
        onConfirmRevoke={() => handleRevoke("edit")}
      />
      <ListCollaboratorsSection listId={listId} role={role} createdBy={createdBy} embedded />
    </div>
  );
}

function ShareLinkSection({
  title,
  description,
  emptyLabel,
  generateLabel,
  copyLabel,
  revokeLabel,
  revokeConfirmLabel,
  cancelLabel,
  url,
  isGenerating,
  isRevoking,
  confirming,
  onGenerate,
  onCopy,
  onRequestRevoke,
  onCancelRevoke,
  onConfirmRevoke,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  generateLabel: string;
  copyLabel: string;
  revokeLabel: string;
  revokeConfirmLabel: string;
  cancelLabel: string;
  url: string | null;
  isGenerating: boolean;
  isRevoking: boolean;
  confirming: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onRequestRevoke: () => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: () => void;
}) {
  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {url ? (
        <div className="grid gap-2">
          <Input readOnly value={url} aria-label={title} />
          {confirming ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelRevoke}
                disabled={isRevoking}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                loading={isRevoking}
                disabled={isRevoking}
                onClick={onConfirmRevoke}
              >
                {revokeConfirmLabel}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onCopy}>
                {copyLabel}
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={onRequestRevoke}>
                {revokeLabel}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          <Button
            type="button"
            size="sm"
            className="w-fit"
            loading={isGenerating}
            disabled={isGenerating}
            onClick={onGenerate}
          >
            {generateLabel}
          </Button>
        </div>
      )}
    </section>
  );
}

function ShareListDesktopDialog(props: ShareListDialogProps) {
  const tLists = useTranslations("lists");
  const state = useShareListDialog(props);

  return (
    <Dialog open={props.open} onOpenChange={state.handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tLists("share.title")}</DialogTitle>
          <DialogDescription>{tLists("share.description")}</DialogDescription>
        </DialogHeader>
        <ShareListBody
          {...state}
          listId={props.listId}
          role={props.role}
          createdBy={props.createdBy}
        />
      </DialogContent>
    </Dialog>
  );
}

function ShareListDrawer(props: ShareListDialogProps) {
  const tLists = useTranslations("lists");
  const state = useShareListDialog(props);

  return (
    <Drawer open={props.open} onOpenChange={state.handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{tLists("share.title")}</DrawerTitle>
          <DrawerDescription>{tLists("share.description")}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <ShareListBody
            {...state}
            listId={props.listId}
            role={props.role}
            createdBy={props.createdBy}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
