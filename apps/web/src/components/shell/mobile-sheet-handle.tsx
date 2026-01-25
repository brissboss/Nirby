"use client";

import { SearchIcon } from "lucide-react";

import { Card, CardContent } from "../ui";

import { UserMenu } from "@/components/map/controls/user-menu";

export function MobileSheetHandle({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0"
      style={{
        bottom: "calc(0.5rem + env(safe-area-inset-bottom))",
        left: "5%",
        right: "5%",
      }}
    >
      <Card className="mx-auto w-full max-w-md p-2 h-fit rounded-[28px] border shadow-2xl bg-background/50 backdrop-blur-md">
        <CardContent className="p-0 flex items-center justify-between gap-2">
          <div
            className="w-full flex items-center justify-start gap-2 px-4 py-2 bg-background/60 rounded-[20px]"
            onClick={onOpen}
          >
            <SearchIcon className="size-5 text-muted-foreground" />
            <p>Search...</p>
          </div>
          <UserMenu className="rounded-full" />
        </CardContent>
      </Card>
    </div>
  );
}
