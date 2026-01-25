"use client";

import { useEffect } from "react";

import { ListPanelContent } from "@/components/panels/list-panel-content";
import { Card, CardContent } from "@/components/ui/card";
import { usePanels } from "@/lib/panels/context";

export default function ListPanelPage() {
  const { rightOpen, setRightOpen } = usePanels();

  useEffect(() => {
    setRightOpen(true);
  }, [setRightOpen]);

  if (!rightOpen) return null;

  return (
    <Card
      className="fixed z-10 w-[50px] md:w-[380px] bg-white dark:bg-background border border-border rounded-xl shadow-lg overflow-hidden flex flex-col p-0 h-fit"
      style={{
        top: "calc(1rem + env(safe-area-inset-top))",
        left: "calc(1rem + env(safe-area-inset-left) + 380px + 0.75rem)",
        bottom: "calc(1rem + env(safe-area-inset-bottom))",
        maxHeight: "calc(100vh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
      }}
    >
      <CardContent className="flex flex-col h-full min-h-0 p-0">
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          <ListPanelContent />
        </div>
      </CardContent>
    </Card>
  );
}
