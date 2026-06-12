"use client";

import { useEffect } from "react";

import {
  MOBILE_CHROME_BOTTOM_EXPANDED,
  MOBILE_CHROME_BOTTOM_MAP_MODE,
} from "../constants/shell.constants";

export function useMobileChromeBottom(mapMode: boolean) {
  useEffect(() => {
    const chromeBottom = mapMode ? MOBILE_CHROME_BOTTOM_MAP_MODE : MOBILE_CHROME_BOTTOM_EXPANDED;
    document.documentElement.style.setProperty("--shell-mobile-chrome-bottom", chromeBottom);
    return () => {
      document.documentElement.style.removeProperty("--shell-mobile-chrome-bottom");
    };
  }, [mapMode]);
}
