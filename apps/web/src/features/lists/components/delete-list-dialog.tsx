"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useDeleteList } from "../hooks/use-delete-list";

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

export type DeleteListDialogProps = {
  listId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function DeleteListDialog({ listId, open, onOpenChange, onDeleted }: DeleteListDialogProps) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: deleteList, isPending } = useDeleteList();

  async function handleDelete() {
    if (isPending) return;

    try {
      await deleteList(listId);
      toast.success(tLists("deleteList.success"));
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      if (getErrorCode(error) === "LIST_NOT_FOUND") {
        onOpenChange(false);
        onDeleted();
        return;
      }

      toast.error(tLists("deleteList.error"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tLists("delete.title")}</DialogTitle>
          <DialogDescription>{tLists("delete.description")}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {tCommon("buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            loading={isPending}
            onClick={handleDelete}
          >
            {tLists("delete.confirmSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
