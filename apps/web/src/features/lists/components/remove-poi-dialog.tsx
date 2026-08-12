"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRemovePoiFromList } from "../hooks/use-remove-poi-from-list";

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

export type RemovePoiDialogProps = {
  listId: string;
  savedPoiId: string;
  placeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RemovePoiDialog({
  listId,
  savedPoiId,
  placeName,
  open,
  onOpenChange,
}: RemovePoiDialogProps) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: removePoi, isPending } = useRemovePoiFromList();

  async function handleRemove() {
    if (isPending) return;

    try {
      await removePoi({ listId, savedPoiId });
      toast.success(tLists("removePoi.success"));
      onOpenChange(false);
    } catch (error) {
      if (getErrorCode(error) === "SAVED_POI_NOT_FOUND") {
        onOpenChange(false);
        return;
      }

      toast.error(tLists("removePoi.error"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tLists("removePoi.title")}</DialogTitle>
          <DialogDescription>
            {tLists("removePoi.description", { placeName })}
          </DialogDescription>
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
            onClick={handleRemove}
          >
            {tLists("removePoi.confirmSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
