"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@/components/editor-context";
import { renderPaintScene } from "@/lib/paint/CanvasRenderer";

export function PaintRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editor = useEditor();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      !editor.image ||
      editor.beforeAfterEnabled ||
      editor.maskOnlyPreview
    ) {
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      const rendered = document.createElement("canvas");
      void renderPaintScene({
        canvas: rendered,
        globalBlendMode: editor.globalBlendMode,
        image: editor.image!,
        includeOriginal: false,
        masks: editor.masks,
        whiteBasePreviewMaskId: editor.whiteBasePreviewMaskId,
      }).then(() => {
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
  }, [
    editor.beforeAfterEnabled,
    editor.globalBlendMode,
    editor.image,
    editor.maskOnlyPreview,
    editor.masks,
    editor.whiteBasePreviewMaskId,
  ]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />
      {editor.whiteBasePreviewMaskId ? (
        <span className="pointer-events-none absolute bottom-3 left-3 z-20 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-[#303830] shadow-sm">
          Base neutralizada
        </span>
      ) : null}
    </>
  );
}
