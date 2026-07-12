"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useEditor } from "@/components/editor-context";
import { PendingObjectPreview } from "@/components/decor/pending-object-preview";
import { PlacedDecorObjectView } from "@/components/decor/placed-decor-object-view";
import { clampObjectToImage, clientPointToImagePoint, resizeObjectFromHandle, rotateObjectFromPointer } from "@/lib/decor/objectPlacementGeometry";
import type { ImageDimensions, ImagePoint } from "@/types/editor";
import type { ObjectResizeHandle, PlacedDecorObject } from "@/types/placed-decor-object";

type ActiveInteraction = {
  kind: "moving" | "resizing" | "rotating";
  pointerId: number;
  object: PlacedDecorObject;
  startPointer: ImagePoint;
  handle?: ObjectResizeHandle;
};

export function DecorObjectsLayer({ dimensions, canvasScale }: { dimensions: ImageDimensions; canvasScale: number }) {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const layerRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<ActiveInteraction | null>(null);
  const [previewObject, setPreviewObject] = useState<PlacedDecorObject | null>(null);
  const [cursorPoint, setCursorPoint] = useState<ImagePoint | null>(null);
  const interactive = editor.activeTool === "objects" || editor.activeTool === "select";

  function beginInteraction(kind: ActiveInteraction["kind"], object: PlacedDecorObject, event: ReactPointerEvent<HTMLElement>, handle?: ObjectResizeHandle) {
    if (!interactive || object.locked || !layerRef.current || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startPointer = clientPointToImagePoint({ x: event.clientX, y: event.clientY }, layerRef.current.getBoundingClientRect(), dimensions);
    interactionRef.current = { kind, pointerId: event.pointerId, object, startPointer, handle };
    placement.selectPlacedObject(object.id);
    placement.setObjectInteractionMode(kind);
    setPreviewObject(object);
  }

  function finishInteraction(event: ReactPointerEvent<HTMLDivElement>, commit = true) {
    const active = interactionRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (commit && previewObject) placement.updatePlacedObject(active.object.id, previewObject);
    interactionRef.current = null; setPreviewObject(null); placement.setObjectInteractionMode("idle");
  }

  const displayed = placement.placedObjects.map((object) => previewObject?.id === object.id ? previewObject : object).sort((first, second) => first.zIndex - second.zIndex);
  return <div ref={layerRef} className="absolute inset-0 z-20" style={{ pointerEvents: interactive ? "auto" : "none", cursor: placement.isPlacingObject && editor.activeTool === "objects" ? "crosshair" : undefined }} onPointerDown={(event) => {
    if (event.target !== event.currentTarget || !layerRef.current) return;
    const point = clientPointToImagePoint({ x: event.clientX, y: event.clientY }, layerRef.current.getBoundingClientRect(), dimensions);
    if (placement.pendingDecorObject && editor.activeTool === "objects") { event.preventDefault(); event.stopPropagation(); placement.addPlacedObject(placement.pendingDecorObject, point); setCursorPoint(null); return; }
    placement.clearObjectSelection();
  }} onPointerMove={(event) => {
    if (!layerRef.current) return;
    const pointer = clientPointToImagePoint({ x: event.clientX, y: event.clientY }, layerRef.current.getBoundingClientRect(), dimensions);
    if (placement.pendingDecorObject && editor.activeTool === "objects") setCursorPoint(pointer);
    const active = interactionRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    if (active.kind === "moving") {
      setPreviewObject(clampObjectToImage({ ...active.object, x: active.object.x + pointer.x - active.startPointer.x, y: active.object.y + pointer.y - active.startPointer.y }, dimensions));
    } else if (active.kind === "resizing" && active.handle) {
      setPreviewObject(resizeObjectFromHandle(active.object, active.handle, pointer, dimensions, event.shiftKey ? !active.object.lockAspectRatio : active.object.lockAspectRatio));
    } else if (active.kind === "rotating") {
      setPreviewObject(clampObjectToImage({ ...active.object, rotation: rotateObjectFromPointer(active.object, active.startPointer, pointer, event.shiftKey) }, dimensions));
    }
  }} onPointerUp={(event) => finishInteraction(event)} onPointerCancel={(event) => finishInteraction(event, false)} onLostPointerCapture={(event) => finishInteraction(event)} onPointerLeave={() => { if (!interactionRef.current) setCursorPoint(null); }}>
    {displayed.map((object) => <PlacedDecorObjectView key={object.id} object={object} canvasScale={canvasScale} interactive={interactive && !placement.isPlacingObject} onPointerDown={(event) => { placement.selectPlacedObject(object.id); if (!object.locked) beginInteraction("moving", object, event); else { event.preventDefault(); event.stopPropagation(); } }} onResizeStart={(handle, event) => beginInteraction("resizing", object, event, handle)} onRotateStart={(event) => beginInteraction("rotating", object, event)} />)}
    {placement.pendingDecorObject && cursorPoint && editor.activeTool === "objects" ? <PendingObjectPreview object={placement.pendingDecorObject} point={cursorPoint} dimensions={dimensions} /> : null}
  </div>;
}
