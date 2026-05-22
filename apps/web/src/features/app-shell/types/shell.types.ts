import type { LucideIcon } from "lucide-react";

export type ShellView = "explore" | "lists" | "profile";

export type ShellViewConfig = {
  icon: LucideIcon;
  id: ShellView;
};
