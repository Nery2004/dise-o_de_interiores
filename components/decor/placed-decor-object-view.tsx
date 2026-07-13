"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { memo, type PointerEvent as ReactPointerEvent, useState } from "react";
import { toast } from "sonner";
import { ObjectSelectionBox } from "@/components/decor/object-selection-box";
import { PerspectiveObjectCanvas } from "@/components/decor/perspective-object-canvas";
import { PerspectiveSelectionBox } from "@/components/decor/perspective-selection-box";
import {
  perspectivePointsArray,
  polygonBounds,
} from "@/lib/perspective/surfaceGeometry";
import type {
  ObjectResizeHandle,
  PlacedDecorObject,
} from "@/types/placed-decor-object";
import { useRoomLighting } from "@/components/room-lighting-context";
import { createContactShadow } from "@/lib/lighting/contactShadow";
import { createProjectedShadow } from "@/lib/lighting/projectedShadow";
import { useDecorPlacement } from "@/components/decor-placement-context";

const failedAssets = new Set<string>();

export const PlacedDecorObjectView = memo(function PlacedDecorObjectView({
  object,
  canvasScale,
  interactive,
  draft,
  onPointerDown,
  onResizeStart,
  onRotateStart,
  onPerspectiveStart,
}: {
  object: PlacedDecorObject;
  canvasScale: number;
  interactive: boolean;
  draft?: boolean;
  onPointerDown: (object: PlacedDecorObject, event: ReactPointerEvent<HTMLElement>) => void;
  onResizeStart: (
    object: PlacedDecorObject,
    handle: ObjectResizeHandle,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onRotateStart: (object: PlacedDecorObject, event: ReactPointerEvent<HTMLElement>) => void;
  onPerspectiveStart: (
    object: PlacedDecorObject,
    index: number,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
}) {
  const lighting = useRoomLighting();
  const placement = useDecorPlacement();
  const [failed, setFailed] = useState(false);
  const profile = lighting.profiles.find((item) => item.id === object.lightProfileId) ?? lighting.activeProfile;
  const surface = placement.placementSurfaces.find((item) => item.id === object.surfaceId);
  const contact = createContactShadow(object, surface, profile);
  const projected = createProjectedShadow(object, surface, profile);
  const projectedColor = projected
    ? `${projected.color}${Math.round(projected.opacity * 255).toString(16).padStart(2, "0")}`
    : undefined;
  if (!object.visible) return null;
  if (object.perspectiveMode !== "none" && object.perspectivePoints) {
    const bounds = polygonBounds(
      perspectivePointsArray(object.perspectivePoints),
    );
    return (
      <div
        data-placed-decor-object={object.id}
        className="absolute touch-none select-none"
        onPointerDown={(event) => onPointerDown(object, event)}
        style={{
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
          zIndex: object.zIndex + 1,
          cursor:
            interactive && !object.locked
              ? "move"
              : object.locked
                ? "not-allowed"
                : "default",
          pointerEvents: interactive ? "auto" : "none",
        }}
      >
        <PerspectiveObjectCanvas object={object} draft={draft} />
        {object.selected && interactive ? (
          <PerspectiveSelectionBox
            object={object}
            canvasScale={canvasScale}
            onPerspectiveStart={(index, event) => onPerspectiveStart(object, index, event)}
          />
        ) : null}
      </div>
    );
  }
  return (
    <div
      data-placed-decor-object={object.id}
      className="absolute touch-none select-none"
      onPointerDown={(event) => onPointerDown(object, event)}
      style={{
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        zIndex: object.zIndex + 1,
        transform: `translate(-50%,-50%) rotate(${object.rotation}deg)`,
        transformOrigin: "center",
        cursor:
          interactive && !object.locked
            ? "move"
            : object.locked
              ? "not-allowed"
              : "default",
        pointerEvents: interactive ? "auto" : "none",
        willChange: "transform,left,top,width,height",
      }}
    >
      {contact ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-full -z-10 rounded-[50%]"
          style={{
            width: contact.width,
            height: contact.height,
            backgroundColor: contact.color,
            opacity: contact.opacity * object.opacity,
            filter: `blur(${contact.blur}px)`,
            transform: `translate(-50%,-50%) rotate(${contact.rotation - object.rotation}deg)`,
          }}
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          opacity: object.opacity,
          transform: `scale(${object.flipX ? -1 : 1},${object.flipY ? -1 : 1})`,
          filter: projected
            ? `drop-shadow(${projected.offsetX}px ${projected.offsetY}px ${projected.blur}px ${projectedColor}) brightness(${Math.max(0.2, 1 + object.brightness / 100)}) contrast(${Math.max(0.2, 1 + object.contrast / 100)}) saturate(${Math.max(0, 1 + object.saturation / 100)}) blur(${object.depthBlur}px)`
            : object.lightingMode === "none"
              ? undefined
              : `brightness(${Math.max(0.2, 1 + object.brightness / 100)}) contrast(${Math.max(0.2, 1 + object.contrast / 100)}) saturate(${Math.max(0, 1 + object.saturation / 100)}) blur(${object.depthBlur}px)`,
        }}
      >
        {failed ? (
          <div
            className="grid h-full w-full place-items-center border border-dashed border-[#b42318] bg-[#fff1f0]/90 text-[#b42318]"
            role="img"
            aria-label={`No se pudo cargar ${object.name}`}
          >
            <ImageOff size={Math.min(32, object.width / 3)} />
          </div>
        ) : (
          <Image
            src={object.assetUrl}
            alt={object.name}
            fill
            unoptimized
            draggable={false}
            sizes={`${Math.max(1, Math.round(object.width * canvasScale))}px`}
            className="pointer-events-none object-contain"
            onError={() => {
              setFailed(true);
              if (!failedAssets.has(object.assetUrl)) {
                failedAssets.add(object.assetUrl);
                toast.error("No se pudo cargar este objeto.");
              }
            }}
          />
        )}
      </div>
      {object.selected && interactive ? (
        <ObjectSelectionBox
          object={object}
          canvasScale={canvasScale}
          onResizeStart={(handle, event) => onResizeStart(object, handle, event)}
          onRotateStart={(event) => onRotateStart(object, event)}
        />
      ) : null}
    </div>
  );
});
