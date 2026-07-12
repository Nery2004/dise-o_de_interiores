"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import {
  perspectivePointsArray,
  polygonBounds,
} from "@/lib/perspective/surfaceGeometry";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function PerspectiveSelectionBox({
  object,
  canvasScale,
  onPerspectiveStart,
}: {
  object: PlacedDecorObject;
  canvasScale: number;
  onPerspectiveStart: (
    index: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
}) {
  if (!object.perspectivePoints) return null;
  const points = perspectivePointsArray(object.perspectivePoints);
  const bounds = polygonBounds(points);
  const inverse = 1 / Math.max(canvasScale, 0.01);
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <polygon
          points={points
            .map((point) => `${point.x - bounds.left},${point.y - bounds.top}`)
            .join(" ")}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={1.5 * inverse}
        />
      </svg>
      <span
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-[#7c3aed] px-2 py-1 text-white"
        style={{ fontSize: 11 * inverse }}
      >
        {object.name} · perspectiva
      </span>
      {points.map((point, index) => (
        <button
          key={index}
          type="button"
          data-canvas-control="true"
          aria-label={`Ajustar esquina ${index + 1} de ${object.name}`}
          onPointerDown={(event) => onPerspectiveStart(index, event)}
          className="object-transform-handle pointer-events-auto absolute rounded-full border-2 border-[#7c3aed] bg-white shadow"
          style={
            {
              "--object-handle-size": `${12 * inverse}px`,
              left: point.x - bounds.left,
              top: point.y - bounds.top,
              cursor: "move",
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
