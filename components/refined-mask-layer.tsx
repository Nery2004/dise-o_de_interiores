"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@/components/editor-context";
import { createFinalMaskCanvas, paintAlphaCanvas } from "@/lib/masks/maskCompositor";
import type { ImageDimensions, WallMask } from "@/types/editor";

function RefinedMaskCanvas({ dimensions, mask }: { dimensions: ImageDimensions; mask: WallMask }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const alpha = createFinalMaskCanvas(mask, dimensions);
    paintAlphaCanvas(context, alpha, mask.color ?? "#7aa7d9");
  }, [dimensions, mask]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-20" />;
}

export function RefinedMaskLayer({ dimensions }: { dimensions: ImageDimensions }) {
  const { activeTool, beforeAfterEnabled, maskOnlyPreview, maskPreviewEnabled, masks, selectedMaskId } = useEditor();
  const isBrushTool = activeTool === "add-to-mask" || activeTool === "remove-from-mask";
  if (beforeAfterEnabled || maskOnlyPreview) return null;

  return masks.filter((mask) => {
    const count = (mask.refinement?.addStrokes.length ?? 0) + (mask.refinement?.removeStrokes.length ?? 0);
    const isHandledByBrush = isBrushTool && mask.id === selectedMaskId;
    return mask.visible && !mask.color && count > 0 && !isHandledByBrush && maskPreviewEnabled;
  }).map((mask) => <RefinedMaskCanvas key={mask.id} dimensions={dimensions} mask={mask} />);
}
