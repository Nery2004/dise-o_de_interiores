"use client";

import {
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

type ActiveInteraction = {
  kind: "moving" | "resizing" | "rotating" | "perspective";
  pointerId: number;
  object: PlacedDecorObject;
  startPointer: ImagePoint;
  handle?: ObjectResizeHandle;
  perspectiveIndex?: number;
};

export function DecorObjectsLayer({
  dimensions,
  canvasScale,
}: {
  dimensions: ImageDimensions;
  canvasScale: number;
}) {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const layerRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<ActiveInteraction | null>(null);
  const [previewObject, setPreviewObject] = useState<PlacedDecorObject | null>(
    null,
  );
  const [cursorPoint, setCursorPoint] = useState<ImagePoint | null>(null);
  const interactive =
    editor.activeTool === "objects" || editor.activeTool === "select";

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
    placement.selectPlacedObject(object.id);
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
      else if (active.kind === "moving")
        placement.finalizeObjectPlacement(active.object.id, previewObject);
      else placement.updatePlacedObject(active.object.id, previewObject);
    }
    interactionRef.current = null;
    setPreviewObject(null);
    placement.setObjectInteractionMode("idle");
  }

  const displayed = placement.placedObjects
    .map((object) => (previewObject?.id === object.id ? previewObject : object))
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
        placement.clearObjectSelection();
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
      onPointerUp={(event) => finishInteraction(event)}
      onPointerCancel={(event) => finishInteraction(event, false)}
      onLostPointerCapture={(event) => finishInteraction(event)}
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
            placement.selectPlacedObject(object.id);
            if (!object.locked) beginInteraction("moving", object, event);
            else {
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
    </div>
  );
}
