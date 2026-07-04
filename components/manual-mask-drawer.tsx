"use client";

import type { ImagePoint } from "@/types/editor";

type ManualMaskDrawerProps = {
  closeThreshold: number;
  cursorPreviewPoint: ImagePoint | null;
  isDrawing: boolean;
  points: ImagePoint[];
};

function pointsToString(points: ImagePoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function ManualMaskDrawer({
  closeThreshold,
  cursorPreviewPoint,
  isDrawing,
  points,
}: ManualMaskDrawerProps) {
  if (!isDrawing || points.length === 0) {
    return null;
  }

  const lastPoint = points.at(-1);

  return (
    <g className="pointer-events-none">
      {points.length >= 3 ? (
        <polygon
          points={pointsToString(points)}
          fill="#60a5fa"
          fillOpacity={0.16}
          stroke="none"
        />
      ) : null}
      <polyline
        points={pointsToString(points)}
        fill="none"
        stroke="#2563eb"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
      {lastPoint && cursorPreviewPoint ? (
        <line
          x1={lastPoint.x}
          y1={lastPoint.y}
          x2={cursorPreviewPoint.x}
          y2={cursorPreviewPoint.y}
          stroke="#2563eb"
          strokeDasharray="8 8"
          strokeLinecap="round"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={point.x}
          cy={point.y}
          r={index === 0 ? closeThreshold : 7}
          fill={index === 0 ? "#dbeafe" : "#ffffff"}
          fillOpacity={index === 0 ? 0.42 : 1}
          stroke="#2563eb"
          strokeWidth={index === 0 ? 3 : 2}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}
