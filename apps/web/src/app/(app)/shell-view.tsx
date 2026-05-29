"use client";

import type { ComponentType } from "react";

import type { ShellView } from "@/features/app-shell";
import { ListsShellView } from "@/features/lists";
import { ProfileShellView } from "@/features/profile";

function ExplorePlaceholder() {
  return <p className="py-6 text-sm text-muted-foreground">Explorer — contenu à venir.</p>;
}

export const shellViewComponents: Record<ShellView, ComponentType> = {
  explore: ExplorePlaceholder,
  lists: ListsShellView,
  profile: ProfileShellView,
};
