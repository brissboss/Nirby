"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type ProfileMenuRowProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function ProfileMenuRow({ label, onClick, className }: ProfileMenuRowProps) {
  return (
    <Button
      type="button"
      variant="panel"
      onClick={onClick}
      className={cn("justify-between", className)}
    >
      <span>{label}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Button>
  );
}
