"use client";

import { useTranslations } from "next-intl";

import { EditPoiForm } from "../forms/edit-poi-form";

import {
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
} from "@/components/ui";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Poi } from "@/lib/api";

export type EditPoiDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poi: Poi & { id: string };
  listId?: string;
};

/** Edit custom POI: Dialog on desktop, Drawer on mobile. */
export function EditPoiDialog(props: EditPoiDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <EditPoiDrawer {...props} /> : <EditPoiDesktopDialog {...props} />;
}

function EditPoiDesktopDialog({ open, onOpenChange, poi, listId }: EditPoiDialogProps) {
  const tPoi = useTranslations("poi");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tPoi("edit.title")}</DialogTitle>
          <DialogDescription className="sr-only">{tPoi("edit.title")}</DialogDescription>
        </DialogHeader>
        <EditPoiForm poi={poi} listId={listId} closeDialog={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditPoiDrawer({ open, onOpenChange, poi, listId }: EditPoiDialogProps) {
  const tPoi = useTranslations("poi");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{tPoi("edit.title")}</DrawerTitle>
          <DrawerDescription className="sr-only">{tPoi("edit.title")}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">
          <EditPoiForm poi={poi} listId={listId} closeDialog={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
