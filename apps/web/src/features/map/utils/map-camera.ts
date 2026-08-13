import type { PaddingOptions } from "mapbox-gl";

export const SELECTED_POI_MIN_ZOOM = 15;

export function getSelectedPoiZoom(currentZoom: number): number {
  return Math.max(currentZoom, SELECTED_POI_MIN_ZOOM);
}

export function getShellViewportPadding(container: HTMLElement): PaddingOptions {
  const isDesktop = container.clientWidth >= 768;

  if (isDesktop) {
    return { left: 390, top: 80, right: 80, bottom: 80 };
  }

  return { bottom: 96, top: 80, left: 24, right: 24 };
}
