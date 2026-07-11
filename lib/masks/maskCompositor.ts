import { interpolatePoints } from "@/lib/geometry/brushGeometry";
import { buildCanvasPath } from "@/lib/mask-geometry";
import type { BrushStroke, ImageDimensions, ImagePoint, WallMask } from "@/types/editor";

export function createCanvas(dimensions: ImageDimensions) {
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  return canvas;
}

function stampBrush(
  context: CanvasRenderingContext2D,
  point: ImagePoint,
  stroke: Pick<BrushStroke, "size" | "hardness" | "opacity">,
) {
  const radius = stroke.size / 2;
  const hardness = Math.min(Math.max(stroke.hardness, 0), 0.999);
  const gradient = context.createRadialGradient(
    point.x,
    point.y,
    radius * hardness,
    point.x,
    point.y,
    radius,
  );
  gradient.addColorStop(0, `rgba(255,255,255,${stroke.opacity})`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
}

export function renderStrokeSegment(
  context: CanvasRenderingContext2D,
  stroke: Pick<BrushStroke, "mode" | "size" | "hardness" | "opacity">,
  start: ImagePoint,
  end: ImagePoint,
) {
  context.save();
  context.globalCompositeOperation = stroke.mode === "add" ? "source-over" : "destination-out";
  const points = [start, ...interpolatePoints(start, end, Math.max(1, stroke.size / 6))];
  points.forEach((point) => stampBrush(context, point, stroke));
  context.restore();
}

export function renderBrushStroke(context: CanvasRenderingContext2D, stroke: BrushStroke) {
  if (stroke.points.length === 0) return;
  if (stroke.points.length === 1) {
    renderStrokeSegment(context, stroke, stroke.points[0], stroke.points[0]);
    return;
  }
  stroke.points.slice(1).forEach((point, index) => {
    renderStrokeSegment(context, stroke, stroke.points[index], point);
  });
}

export function renderBaseMask(context: CanvasRenderingContext2D, mask: WallMask) {
  const path = buildCanvasPath(mask);
  if (!path) return;
  context.save();
  context.fillStyle = "#ffffff";
  context.fill(path);
  context.restore();
}

export function renderMaskAlpha(
  context: CanvasRenderingContext2D,
  mask: WallMask,
  dimensions: ImageDimensions,
) {
  context.clearRect(0, 0, dimensions.width, dimensions.height);
  renderBaseMask(context, mask);
  mask.refinement?.addStrokes.forEach((stroke) => renderBrushStroke(context, stroke));
  mask.refinement?.removeStrokes.forEach((stroke) => renderBrushStroke(context, stroke));
}

export function createFinalMaskCanvas(mask: WallMask, dimensions: ImageDimensions) {
  const canvas = createCanvas(dimensions);
  const context = canvas.getContext("2d");
  if (context) renderMaskAlpha(context, mask, dimensions);
  return canvas;
}

export function paintAlphaCanvas(
  target: CanvasRenderingContext2D,
  alphaCanvas: HTMLCanvasElement,
  color: string,
  inverted = false,
) {
  target.clearRect(0, 0, target.canvas.width, target.canvas.height);
  if (inverted) {
    target.fillStyle = color;
    target.fillRect(0, 0, target.canvas.width, target.canvas.height);
    target.globalCompositeOperation = "destination-out";
    target.drawImage(alphaCanvas, 0, 0);
  } else {
    target.drawImage(alphaCanvas, 0, 0);
    target.globalCompositeOperation = "source-in";
    target.fillStyle = color;
    target.fillRect(0, 0, target.canvas.width, target.canvas.height);
  }
  target.globalCompositeOperation = "source-over";
}
