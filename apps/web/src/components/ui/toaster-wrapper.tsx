"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Toaster } from "./sonner";

import { useMediaQuery } from "@/hooks/use-media-query";

export function ToasterWrapper() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const iconSize = isMobile ? "size-5" : "size-4";

  return (
    <Toaster
      richColors
      position="top-center"
      duration={5000}
      mobileOffset={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      icons={{
        success: <CircleCheckIcon className={iconSize} />,
        info: <InfoIcon className={iconSize} />,
        warning: <TriangleAlertIcon className={iconSize} />,
        error: <OctagonXIcon className={iconSize} />,
        loading: <Loader2Icon className={`${iconSize} animate-spin`} />,
      }}
      toastOptions={{
        style: {
          fontSize: isMobile ? "1rem" : "0.875rem",
          gap: isMobile ? "1rem" : "0.25rem",
        },
      }}
    />
  );
}
