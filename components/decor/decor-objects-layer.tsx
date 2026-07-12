"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useEditor } from "@/components/editor-context";
import { PendingObjectPreview } from "@/components/decor/pending-object-preview";
import { PlacedDecorObjectView } from "@/components/decor/placed-decor-object-view";
import {
  clampObjectToImage,
  clientPointToImagePoint,
  resizeObjectFromHandle,
  rotateObjectFromPointer,
} from "@/lib/decor/objectPlacementGeometry";
import type { ImageDimensions, ImagePoint } from "@/types/editor";
import type {
  ObjectResizeHandle,
  PlacedDecorObject,
} from "@/types/placed-decor-object";
import {
  perspectivePointsArray,
  perspectivePointsFromArray,
} from "@/lib/perspective/surfaceGeometry";
import { validatePerspectivePoints } from "@/lib/perspective/perspectiveValidation";
import { toast } from "sonner";
import { useRoomLighting } from "@/components/room-lighting-context";
import { getSmartGuides } from "@/lib/decor/alignmentSystem";

type ActiveInteraction = {
  kind: "moving" | "resizing" | "rotating" | "perspective";
  pointerId: number;
  object: PlacedDecorObject;
  startPointer: ImagePoint;
  handle?: ObjectResizeHandle;
  perspectiveIndex?: number;
};
type MarqueeSelection = { start: ImagePoint; current: ImagePoint; additive: boolean };

export function DecorObjectsLayer({
  dimensions,
  canvasScale,
}: {
  dimensions: ImageDimensions;
  canvasScale: number;
}) {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const lighting = useRoomLighting();
  const setObjectInteractionMode = placement.setObjectInteractionMode;
  const layerRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<ActiveInteraction | null>(null);
  const lightingTimerRef = useRef<number | null>(null);
  const [previewObject, setPreviewObject] = useState<PlacedDecorObject | null>(
    null,
  );
  const [cursorPoint, setCursorPoint] = useState<ImagePoint | null>(null);
  const [marquee, setMarquee] = useState<MarqueeSelection | null>(null);
  const interactive =
    editor.activeTool === "objects" || editor.activeTool === "select";

  useEffect(
    () => () => {
      interactionRef.current = null;
      setObjectInteractionMode("idle");
    },
    [setObjectInteractionMode],
  );

  useEffect(
    () => () => {
      if (lightingTimerRef.current !== null) {
        window.clearTimeout(lightingTimerRef.current);
      }
    },
    [],
  );

  function beginInteraction(
    kind: ActiveInteraction["kind"],
    object: PlacedDecorObject,
    event: ReactPointerEvent<HTMLElement>,
    handle?: ObjectResizeHandle,
    perspectiveIndex?: number,
  ) {
    if (
      !interactive ||
      object.locked ||
      !layerRef.current ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startPointer = clientPointToImagePoint(
      { x: event.clientX, y: event.clientY },
      layerRef.current.getBoundingClientRect(),
      dimensions,
    );
    interactionRef.current = {
      kind,
      pointerId: event.pointerId,
      object,
      startPointer,
      handle,
      perspectiveIndex,
    };
    placement.selectPlacedObject(object.id, { additive: event.shiftKey || event.metaKey || event.ctrlKey, toggle: event.metaKey || event.ctrlKey });
    placement.setObjectInteractionMode(kind);
    setPreviewObject(object);
  }

  function finishInteraction(
    event: ReactPointerEvent<HTMLDivElement>,
    commit = true,
  ) {
    const active = interactionRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (commit && previewObject) {
      if (
        active.kind === "perspective" &&
        previewObject.perspectivePoints &&
        !validatePerspectivePoints(previewObject.perspectivePoints)
      )
        toast.error("La transformación debe conservar un cuadrilátero válido.");
      else if (active.kind === "moving") {
        placement.finalizeObjectPlacement(active.object.id, previewObject);
        if (previewObject.lightingMode === "auto" && !previewObject.lightingLocked) {
          if (lightingTimerRef.current !== null) {
            window.clearTimeout(lightingTimerRef.current);
          }
          lightingTimerRef.current = window.setTimeout(() => {
            lightingTimerRef.current = null;
            void lighting.adaptObject(previewObject);
          }, 180);
        }
      } else placement.updatePlacedObject(active.object.id, previewObject);
    }
    interactionRef.current = null;
    setPreviewObject(null);
    placement.setObjectInteractionMode("idle");
  }

  const previewSource = previewObject ? placement.placedObjects.find((object) => object.id === previewObject.id) : undefined;
  const displayed = placement.placedObjects
    .map((object) => {
      if (previewObject?.id === object.id) return previewObject;
      if (previewObject?.groupId && object.groupId === previewObject.groupId && previewSource) {
        const dx = previewObject.x - previewSource.x;
        const dy = previewObject.y - previewSource.y;
        return { ...object, x: object.x + dx, y: object.y + dy, perspectivePoints: object.perspectivePoints ? Object.fromEntries(Object.entries(object.perspectivePoints).map(([key, point]) => [key, { x: point.x + dx, y: point.y + dy }])) as typeof object.perspectivePoints : undefined };
      }
      return object;
    })
    .sort((first, second) => first.zIndex - second.zIndex);
  return (
    <div
      ref={layerRef}
      className="absolute inset-0 z-20"
      style={{
        pointerEvents: interactive ? "auto" : "none",
        cursor:
          placement.isPlacingObject && editor.activeTool === "objects"
            ? "crosshair"
            : undefined,
      }}
      onPointerDown={(event) => {
        if (event.target !== event.currentTarget || !layerRef.current) return;
        const point = clientPointToImagePoint(
          { x: event.clientX, y: event.clientY },
          layerRef.current.getBoundingClientRect(),
          dimensions,
        );
        if (placement.pendingDecorObject && editor.activeTool === "objects") {
          event.preventDefault();
          event.stopPropagation();
          placement.addPlacedObject(placement.pendingDecorObject, point);
          setCursorPoint(null);
          return;
        }
        if (interactive) {
          event.currentTarget.setPointerCapture(event.pointerId);
          setMarquee({ start: point, current: point, additive: event.shiftKey || event.metaKey || event.ctrlKey });
          placement.setObjectInteractionMode("marquee");
        } else placement.clearObjectSelection();
      }}
      onPointerMove={(event) => {
        if (!layerRef.current) return;
        const pointer = clientPointToImagePoint(
          { x: event.clientX, y: event.clientY },
          layerRef.current.getBoundingClientRect(),
          dimensions,
        );
        if (placement.pendingDecorObject && editor.activeTool === "objects")
          setCursorPoint(pointer);
        if (marquee) {
          setMarquee((current) => current ? { ...current, current: pointer } : null);
          return;
        }
        const active = interactionRef.current;
        if (!active || active.pointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        if (active.kind === "moving") {
          const dx = pointer.x - active.startPointer.x;
          const dy = pointer.y - active.startPointer.y;
          const perspectivePoints = active.object.perspectivePoints
            ? {
                topLeft: {
                  x: active.object.perspectivePoints.topLeft.x + dx,
                  y: active.object.perspectivePoints.topLeft.y + dy,
                },
                topRight: {
                  x: active.object.perspectivePoints.topRight.x + dx,
                  y: active.object.perspectivePoints.topRight.y + dy,
                },
                bottomRight: {
                  x: active.object.perspectivePoints.bottomRight.x + dx,
                  y: active.object.perspectivePoints.bottomRight.y + dy,
                },
                bottomLeft: {
                  x: active.object.perspectivePoints.bottomLeft.x + dx,
                  y: active.object.perspectivePoints.bottomLeft.y + dy,
                },
              }
            : undefined;
          setPreviewObject(
            clampObjectToImage(
              {
                ...active.object,
                perspectivePoints,
                x: active.object.x + dx,
                y: active.object.y + dy,
              },
              dimensions,
            ),
          );
        } else if (active.kind === "resizing" && active.handle) {
          setPreviewObject(
            resizeObjectFromHandle(
              active.object,
              active.handle,
              pointer,
              dimensions,
              event.shiftKey
                ? !active.object.lockAspectRatio
                : active.object.lockAspectRatio,
            ),
          );
        } else if (active.kind === "rotating") {
          setPreviewObject(
            clampObjectToImage(
              {
                ...active.object,
                rotation: rotateObjectFromPointer(
                  active.object,
                  active.startPointer,
                  pointer,
                  event.shiftKey,
                ),
              },
              dimensions,
            ),
          );
        } else if (
          active.kind === "perspective" &&
          active.perspectiveIndex !== undefined &&
          active.object.perspectivePoints
        ) {
          const points = perspectivePointsArray(
            active.object.perspectivePoints,
          );
          points[active.perspectiveIndex] = pointer;
          setPreviewObject({
            ...active.object,
            perspectivePoints: perspectivePointsFromArray(points),
          });
        }
      }}
      onPointerUp={(event) => {
        if (marquee) {
          const left = Math.min(marquee.start.x, marquee.current.x);
          const right = Math.max(marquee.start.x, marquee.current.x);
          const top = Math.min(marquee.start.y, marquee.current.y);
          const bottom = Math.max(marquee.start.y, marquee.current.y);
          const ids = placement.placedObjects.filter((object) => object.visible && object.x + object.width / 2 >= left && object.x - object.width / 2 <= right && object.y + object.height / 2 >= top && object.y - object.height / 2 <= bottom).map((object) => object.id);
          placement.selectPlacedObjects(ids, marquee.additive ? "add" : "replace");
          setMarquee(null);
          placement.setObjectInteractionMode("idle");
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          return;
        }
        finishInteraction(event);
      }}
      onPointerCancel={(event) => {
        setMarquee(null);
        placement.setObjectInteractionMode("idle");
        finishInteraction(event, false);
      }}
      onLostPointerCapture={(event) => {
        setMarquee(null);
        placement.setObjectInteractionMode("idle");
        finishInteraction(event);
      }}
      onPointerLeave={() => {
        if (!interactionRef.current) setCursorPoint(null);
      }}
    >
      {displayed.map((object) => (
        <PlacedDecorObjectView
          key={object.id}
          object={object}
          canvasScale={canvasScale}
          draft={previewObject?.id === object.id}
          interactive={interactive && !placement.isPlacingObject}
          onPointerDown={(event) => {
            if (!object.locked) beginInteraction("moving", object, event);
            else {
              placement.selectPlacedObject(object.id, { additive: event.shiftKey || event.metaKey || event.ctrlKey, toggle: event.metaKey || event.ctrlKey });
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onResizeStart={(handle, event) =>
            beginInteraction("resizing", object, event, handle)
          }
          onRotateStart={(event) => beginInteraction("rotating", object, event)}
          onPerspectiveStart={(index, event) =>
            beginInteraction("perspective", object, event, undefined, index)
          }
        />
      ))}
      {placement.pendingDecorObject &&
      cursorPoint &&
      editor.activeTool === "objects" ? (
        <PendingObjectPreview
          object={placement.pendingDecorObject}
          point={cursorPoint}
          dimensions={dimensions}
        />
      ) : null}
      {previewObject ? getSmartGuides(previewObject, placement.placedObjects).map((guide, index) => guide.axis === "x" ? <span key={`${guide.axis}-${guide.value}-${index}`} className="pointer-events-none absolute inset-y-0 z-50 border-l border-dashed border-[#e11d48]" style={{ left: guide.value }}><span className="absolute left-1 top-2 rounded bg-[#e11d48] px-1 text-[9px] text-white">{guide.label}</span></span> : <span key={`${guide.axis}-${guide.value}-${index}`} className="pointer-events-none absolute inset-x-0 z-50 border-t border-dashed border-[#e11d48]" style={{ top: guide.value }}><span className="absolute left-2 top-1 rounded bg-[#e11d48] px-1 text-[9px] text-white">{guide.label}</span></span>) : null}
      {marquee ? <span className="pointer-events-none absolute z-50 border border-[#2563eb] bg-[#2563eb]/10" style={{ left: Math.min(marquee.start.x, marquee.current.x), top: Math.min(marquee.start.y, marquee.current.y), width: Math.abs(marquee.current.x - marquee.start.x), height: Math.abs(marquee.current.y - marquee.start.y) }} /> : null}
    </div>
  );
}
