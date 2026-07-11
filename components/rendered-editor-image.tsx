"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@/components/editor-context";
import { exportEditedImage } from "@/lib/exportImage";
import type { WallMask } from "@/types/editor";

export function RenderedEditorImage({ masks, className = "" }: { masks?: WallMask[]; className?: string }) {
  const editor = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!editor.image) return;
    let cancelled = false;
    let url: string | null = null;
    void exportEditedImage({ image: editor.image, masks: masks ?? editor.masks, globalBlendMode: editor.globalBlendMode }).then((blob) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { const canvas = canvasRef.current; const context = canvas?.getContext("2d"); if (!canvas || !context || cancelled) return; canvas.width = editor.image!.dimensions.width; canvas.height = editor.image!.dimensions.height; context.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url!); url = null; };
      image.src = url;
    });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [editor.globalBlendMode, editor.image, editor.masks, masks]);
  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} />;
}
