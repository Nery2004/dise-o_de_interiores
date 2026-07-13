"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@/components/editor-context";
import { renderPaintScene } from "@/lib/paint/CanvasRenderer";
import type { WallMask } from "@/types/editor";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { renderPlacedDecorObjects } from "@/lib/decor/renderPlacedDecorObjects";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import { toast } from "sonner";
import { useRoomLighting } from "@/components/room-lighting-context";
import { beginPerformanceMeasure } from "@/lib/performance/performanceMonitor";

let reportedDecorRenderFailure = false;

export function RenderedEditorImage({
  masks,
  placedObjects,
  className = "",
}: {
  masks?: WallMask[];
  placedObjects?: PlacedDecorObject[];
  className?: string;
}) {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const lighting = useRoomLighting();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!editor.image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => {
      const finishMeasure = beginPerformanceMeasure("render");
      const rendered = document.createElement("canvas");
      const bounds = canvas.getBoundingClientRect();
      void renderPaintScene({
        canvas: rendered,
        globalBlendMode: editor.globalBlendMode,
        image: editor.image!,
        includeOriginal: true,
        masks: masks ?? editor.masks,
        previewViewport: {
          width: Math.max(1, bounds.width),
          height: Math.max(1, bounds.height),
        },
        signal: controller.signal,
      }).then(async () => {
        if (cancelled) return;
        const renderedContext = rendered.getContext("2d");
        let failures: string[] = [];
        if (renderedContext) {
          renderedContext.save();
          renderedContext.scale(
            rendered.width / editor.image!.dimensions.width,
            rendered.height / editor.image!.dimensions.height,
          );
          try {
            failures = await renderPlacedDecorObjects(renderedContext, placedObjects ?? placement.placedObjects, { profiles: lighting.profiles, surfaces: placement.placementSurfaces, quality: "high" });
          } finally {
            renderedContext.restore();
          }
        }
        if (failures.length && !reportedDecorRenderFailure) { reportedDecorRenderFailure = true; toast.error("No se pudo cargar este objeto."); }
        if (cancelled) return;
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        canvas.getContext("2d")?.drawImage(rendered, 0, 0);
      }).catch(() => {}).finally(finishMeasure);
    });
    return () => {
      cancelled = true;
      controller.abort();
      cancelAnimationFrame(frame);
    };
  }, [editor.globalBlendMode, editor.image, editor.masks, lighting.profiles, masks, placedObjects, placement.placedObjects, placement.placementSurfaces]);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} />;
}
