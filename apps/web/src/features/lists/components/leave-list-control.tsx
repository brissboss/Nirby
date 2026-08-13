"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useLeaveList } from "../hooks/use-leave-list";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { useErrorMessage } from "@/hooks/use-error-message";
import { getErrorCode } from "@/lib/api/errors";

type LeaveListControlProps = {
  listId: string;
  onLeft: () => void;
};

export function LeaveListControl({ listId, onLeft }: LeaveListControlProps) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: leaveList, isPending } = useLeaveList();
  const [open, setOpen] = useState(false);

  async function handleLeave() {
    if (isPending) return;

    try {
      await leaveList({ listId });
      toast.success(tLists("collaborators.leaveSuccess"));
      setOpen(false);
      onLeft();
    } catch (error) {
      toast.error(tLists("collaborators.leaveError"), {
        description: getErrorMessage(error),
      });
      if (getErrorCode(error) === "LIST_OWNER_CANNOT_LEAVE") {
        return;
      }
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {tLists("collaborators.leave")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLists("collaborators.leaveTitle")}</DialogTitle>
            <DialogDescription>{tLists("collaborators.leaveDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {tCommon("buttons.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={isPending}
              disabled={isPending}
              onClick={handleLeave}
            >
              {tLists("collaborators.leaveConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
