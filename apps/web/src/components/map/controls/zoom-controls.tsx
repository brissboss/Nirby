"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMap } from "@/lib/map/context";

export function ZoomControls() {
  const { map } = useMap();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <ButtonGroup
      orientation="vertical"
      aria-label="Zoom controls"
      className="hidden sm:flex h-fit shadow-xl rounded-xl"
    >
      <Button
        variant="outline"
        size={isMobile ? "icon-lg" : "icon"}
        onClick={() => map?.zoomIn()}
        className="rounded-t-xl"
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        size={isMobile ? "icon-lg" : "icon"}
        onClick={() => map?.zoomOut()}
        className="rounded-b-xl"
      >
        <Minus />
      </Button>
    </ButtonGroup>
  );
}
