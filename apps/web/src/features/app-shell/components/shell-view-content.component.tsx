"use client";

import { useShell } from "../context/shell-context";
import { ShellView } from "../types/shell.types";

type ShellViewContentProps = {
  viewComponents: Record<ShellView, React.ComponentType>;
};

export function ShellViewContent({ viewComponents }: ShellViewContentProps) {
  const { view } = useShell();
  const View = viewComponents[view] ?? viewComponents.explore;
  return <View />;
}
