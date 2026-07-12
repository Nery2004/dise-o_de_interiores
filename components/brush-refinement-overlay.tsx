"use client";

import { type CSSProperties, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { clientPointToImage, shouldAddBrushPoint } from "@/lib/geometry/brushGeometry";
import { createCanvas, paintAlphaCanvas, renderMaskAlpha, renderStrokeSegment } from "@/lib/masks/maskCompositor";
import type { BlendMode, BrushStroke, ImageDimensions, ImagePoint } from "@/types/editor";

function getBrushGuideBlendMode(
  blendMode: BlendMode,
): CSSProperties["mixBlendMode"] {
  return blendMode === "paint-simulation" ? "color" : blendMode;
}

export function BrushRefinementOverlay({ dimensions }: { dimensions: ImageDimensions }) {
  const editor = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alphaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<ImagePoint[]>([]);
  const pointerIdRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const [cursorPoint, setCursorPoint] = useState<ImagePoint | null>(null);
  const selectedMask = editor.masks.find((mask) => mask.id === editor.selectedMaskId);
  const mode: BrushStroke["mode"] = editor.activeTool === "add-to-mask" ? "add" : "remove";
  const isActive = editor.activeTool === "add-to-mask" || editor.activeTool === "remove-from-mask";

  const drawDisplay = useCallback(() => {
    const canvas = canvasRef.current;
    const alphaCanvas = alphaCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !alphaCanvas || !context || !selectedMask) return;
    paintAlphaCanvas(context, alphaCanvas, editor.maskOnlyPreview ? "#ffffff" : selectedMask.color ?? "#7aa7d9", editor.invertRefinementPreview);
  }, [editor.invertRefinementPreview, editor.maskOnlyPreview, selectedMask]);

  const scheduleDisplay = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      drawDisplay();
    });
  }, [drawDisplay]);

  useEffect(() => {
    if (!isActive || !selectedMask) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const alphaCanvas = createCanvas(dimensions);
    const context = alphaCanvas.getContext("2d");
    if (!context) return;
    renderMaskAlpha(context, selectedMask, dimensions);
    alphaCanvasRef.current = alphaCanvas;
    drawDisplay();
  }, [dimensions, drawDisplay, isActive, selectedMask]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  if (!isActive || !selectedMask) return null;
  const brushMask = selectedMask;

  function pointFromEvent(event: PointerEvent<HTMLCanvasElement>) {
    return clientPointToImage({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect(), dimensions);
  }

  const strokeSettings = { mode, size: editor.brushSize, hardness: editor.brushHardness, opacity: editor.brushOpacity };

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!brushMask.visible) {
      toast.error("Muestra la máscara antes de editarla.");
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    const point = pointFromEvent(event);
    pointsRef.current = [point];
    const context = alphaCanvasRef.current?.getContext("2d");
    if (context) {
      renderStrokeSegment(context, strokeSettings, point, point);
      scheduleDisplay();
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const point = pointFromEvent(event);
    setCursorPoint(point);
    if (pointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const previous = pointsRef.current.at(-1);
    if (!shouldAddBrushPoint(previous, point, editor.brushSize) || !previous) return;
    pointsRef.current.push(point);
    const context = alphaCanvasRef.current?.getContext("2d");
    if (context) {
      renderStrokeSegment(context, strokeSettings, previous, point);
      scheduleDisplay();
    }
  }

  function finishStroke(event: PointerEvent<HTMLCanvasElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    pointerIdRef.current = null;
    const points = [...pointsRef.current];
    pointsRef.current = [];
    if (points.length === 0) return;
    const stroke: BrushStroke = {
      id: globalThis.crypto?.randomUUID?.() ?? `brush-${Date.now()}`,
      ...strokeSettings,
      points,
      createdAt: new Date().toISOString(),
    };
    editor.addBrushStroke(brushMask.id, stroke);
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ cursor: "none", opacity: !selectedMask.visible ? 0 : editor.maskOnlyPreview ? 1 : selectedMask.color ? selectedMask.opacity : 0.22, mixBlendMode: editor.maskOnlyPreview ? "normal" : selectedMask.color ? getBrushGuideBlendMode(selectedMask.blendMode ?? editor.globalBlendMode) : "normal" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        onPointerLeave={() => { if (pointerIdRef.current === null) setCursorPoint(null); }}
      />
      {cursorPoint ? <span className="pointer-events-none absolute rounded-full" style={{ left: cursorPoint.x - editor.brushSize / 2, top: cursorPoint.y - editor.brushSize / 2, width: editor.brushSize, height: editor.brushSize, border: `${1.5 / editor.zoom}px solid ${mode === "add" ? "#22c55e" : "#ef4444"}`, boxShadow: `inset 0 0 0 ${(1 - editor.brushHardness) * editor.brushSize * 0.18}px ${mode === "add" ? "rgb(34 197 94 / 0.18)" : "rgb(239 68 68 / 0.18)"}` }} /> : null}
    </>
  );
}
