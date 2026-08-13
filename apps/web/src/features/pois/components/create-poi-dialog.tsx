"use client";

import { useTranslations } from "next-intl";

import { CreatePoiForm } from "../forms/create-poi-form";

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

export type CreatePoiDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (poiId: string) => void;
};

/** Create custom POI: Dialog on desktop, Drawer on mobile. */
export function CreatePoiDialog(props: CreatePoiDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <CreatePoiDrawer {...props} /> : <CreatePoiDesktopDialog {...props} />;
}

function CreatePoiDesktopDialog({ open, onOpenChange, onCreated }: CreatePoiDialogProps) {
  const tPoi = useTranslations("poi");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tPoi("create.title")}</DialogTitle>
          <DialogDescription className="sr-only">{tPoi("create.title")}</DialogDescription>
        </DialogHeader>
        <CreatePoiForm closeDialog={() => onOpenChange(false)} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}

function CreatePoiDrawer({ open, onOpenChange, onCreated }: CreatePoiDialogProps) {
  const tPoi = useTranslations("poi");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{tPoi("create.title")}</DrawerTitle>
          <DrawerDescription className="sr-only">{tPoi("create.title")}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">
          <CreatePoiForm closeDialog={() => onOpenChange(false)} onCreated={onCreated} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
