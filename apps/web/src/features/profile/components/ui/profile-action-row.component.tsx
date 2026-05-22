"use client";

import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui";

type ProfileActionRowProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
};

export function ProfileActionRow({
  label,
  icon: Icon,
  onClick,
  variant = "default",
}: ProfileActionRowProps) {
  return (
    <Button
      type="button"
      variant={variant === "destructive" ? "panel-destructive" : "panel"}
      onClick={onClick}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Button>
  );
}
