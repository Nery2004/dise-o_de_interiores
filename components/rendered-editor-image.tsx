"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@/components/editor-context";
import { renderPaintScene } from "@/lib/paint/CanvasRenderer";
import type { WallMask } from "@/types/editor";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { renderPlacedDecorObjects } from "@/lib/decor/renderPlacedDecorObjects";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import { toast } from "sonner";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!editor.image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      const rendered = document.createElement("canvas");
      void renderPaintScene({
        canvas: rendered,
        globalBlendMode: editor.globalBlendMode,
        image: editor.image!,
        includeOriginal: true,
        masks: masks ?? editor.masks,
      }).then(async () => {
        if (cancelled) return;
        const renderedContext = rendered.getContext("2d");
        const failures = renderedContext ? await renderPlacedDecorObjects(renderedContext, placedObjects ?? placement.placedObjects) : [];
        if (failures.length && !reportedDecorRenderFailure) { reportedDecorRenderFailure = true; toast.error("No se pudo cargar este objeto."); }
        if (cancelled) return;
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        canvas.getContext("2d")?.drawImage(rendered, 0, 0);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [editor.globalBlendMode, editor.image, editor.masks, masks, placedObjects, placement.placedObjects]);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} />;
}
