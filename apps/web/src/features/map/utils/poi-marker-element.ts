export function createPoiMarkerElement(label?: string): HTMLDivElement {
  const element = document.createElement("div");
  element.className = "nirby-poi-marker";

  if (label) {
    element.setAttribute("aria-label", label);
  }

  return element;
}
