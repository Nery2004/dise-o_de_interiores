"use client";

import { DecorObjectPreview } from "@/components/decor/decor-object-preview";
import { getInitialObjectSize } from "@/lib/decor/objectPlacementGeometry";
import type { DecorObject } from "@/types/decor-object";
import type { ImageDimensions, ImagePoint } from "@/types/editor";

export function PendingObjectPreview({ object, point, dimensions }: { object: DecorObject; point: ImagePoint; dimensions: ImageDimensions }) {
  const size = getInitialObjectSize(object, dimensions);
  return <div className="pointer-events-none absolute z-[10000] opacity-65 drop-shadow-xl" style={{ left: point.x, top: point.y, width: size.width, height: size.height, transform: "translate(-50%,-50%)" }}><DecorObjectPreview object={object} detail className="h-full w-full" sizes={`${Math.round(size.width)}px`} /><span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#202621] px-2 py-1 text-xs font-semibold text-white">Haz clic para colocar</span></div>;
}
