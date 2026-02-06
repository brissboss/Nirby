export function getPrimaryColorAsRgb(): string {
  if (typeof document === "undefined") return "rgb(148, 163, 184)";
  const el = document.createElement("div");
  el.style.cssText =
    "position:absolute;left:-9999px;width:1px;height:1px;background-color:var(--primary)";
  document.body.appendChild(el);
  const computed = getComputedStyle(el).backgroundColor;
  document.body.removeChild(el);
  if (!computed) return "rgb(148, 163, 184)";

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "rgb(148, 163, 184)";
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}
