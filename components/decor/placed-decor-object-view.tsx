"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { memo, type PointerEvent as ReactPointerEvent, useState } from "react";
import { toast } from "sonner";
import { ObjectSelectionBox } from "@/components/decor/object-selection-box";
import type { ObjectResizeHandle, PlacedDecorObject } from "@/types/placed-decor-object";

const failedAssets = new Set<string>();

export const PlacedDecorObjectView = memo(function PlacedDecorObjectView({ object, canvasScale, interactive, onPointerDown, onResizeStart, onRotateStart }: { object: PlacedDecorObject; canvasScale: number; interactive: boolean; onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void; onResizeStart: (handle: ObjectResizeHandle, event: ReactPointerEvent<HTMLButtonElement>) => void; onRotateStart: (event: ReactPointerEvent<HTMLButtonElement>) => void }) {
  const [failed, setFailed] = useState(false);
  if (!object.visible) return null;
  return <div data-placed-decor-object={object.id} className="absolute touch-none select-none" onPointerDown={onPointerDown} style={{ left: object.x, top: object.y, width: object.width, height: object.height, zIndex: object.zIndex + 1, transform: `translate(-50%,-50%) rotate(${object.rotation}deg)`, transformOrigin: "center", cursor: interactive && !object.locked ? "move" : object.locked ? "not-allowed" : "default", pointerEvents: interactive ? "auto" : "none", willChange: "transform,left,top,width,height" }}>
    <div className="absolute inset-0" style={{ opacity: object.opacity, transform: `scale(${object.flipX ? -1 : 1},${object.flipY ? -1 : 1})` }}>{failed ? <div className="grid h-full w-full place-items-center border border-dashed border-[#b42318] bg-[#fff1f0]/90 text-[#b42318]" role="img" aria-label={`No se pudo cargar ${object.name}`}><ImageOff size={Math.min(32, object.width / 3)} /></div> : <Image src={object.assetUrl} alt={object.name} fill unoptimized draggable={false} sizes={`${Math.max(1, Math.round(object.width * canvasScale))}px`} className="pointer-events-none object-contain" onError={() => { setFailed(true); if (!failedAssets.has(object.assetUrl)) { failedAssets.add(object.assetUrl); toast.error("No se pudo cargar este objeto."); } }} />}</div>
    {object.selected && interactive ? <ObjectSelectionBox object={object} canvasScale={canvasScale} onResizeStart={onResizeStart} onRotateStart={onRotateStart} /> : null}
  </div>;
});
