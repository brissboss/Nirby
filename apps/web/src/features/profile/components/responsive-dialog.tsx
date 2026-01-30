import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Separator,
} from "@/components/ui";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export function ResponsiveDialog({
  title,
  description,
  children,
  isOpen,
  onOpenChange,
  showDescriptionSrOnly = true,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  showDescriptionSrOnly?: boolean;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="gap-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={cn(showDescriptionSrOnly ? "sr-only" : "")}>
            {description}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="no-scrollbar max-h-[calc(100vh-8rem)] overflow-y-auto px-4">{children}</div>

        <Separator />
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={cn(showDescriptionSrOnly ? "sr-only" : "")}>
            {description}
          </DialogDescription>
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}

export default ResponsiveDialog;
