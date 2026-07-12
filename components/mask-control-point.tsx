"use client";

import type { PointerEvent } from "react";
import type { ImagePoint } from "@/types/editor";

type MaskControlPointProps = {
  index: number;
  point: ImagePoint;
  selected: boolean;
  zoom: number;
  onPointerDown: (event: PointerEvent<SVGCircleElement>, index: number) => void;
};

export function MaskControlPoint({ index, point, selected, zoom, onPointerDown }: MaskControlPointProps) {
  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={7 / zoom}
      fill={selected ? "#f59e0b" : "#ffffff"}
      stroke={selected ? "#92400e" : "#2563eb"}
      strokeWidth={2}
      vectorEffect="non-scaling-stroke"
      className="cursor-grab touch-none active:cursor-grabbing"
      onPointerDown={(event) => onPointerDown(event, index)}
    />
  );
}
