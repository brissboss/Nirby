"use client";

import type { ComponentType } from "react";

import type { ShellView } from "@/features/app-shell";
import { ExploreShellView } from "@/features/explore";
import { ListsShellView } from "@/features/lists";
import { ProfileShellView } from "@/features/profile";

export const shellViewComponents: Record<ShellView, ComponentType> = {
  explore: ExploreShellView,
  lists: ListsShellView,
  profile: ProfileShellView,
};
