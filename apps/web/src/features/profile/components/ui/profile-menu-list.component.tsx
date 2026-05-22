"use client";

import { cn } from "@/lib/utils";

export function ProfileMenuList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <nav className={cn("grid gap-2", className)}>{children}</nav>;
}
