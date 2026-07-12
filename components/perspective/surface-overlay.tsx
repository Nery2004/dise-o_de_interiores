"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useEditor } from "@/components/editor-context";
import { clientPointToImagePoint } from "@/lib/decor/objectPlacementGeometry";
import { polygonCentroid } from "@/lib/perspective/surfaceGeometry";
import { isTypingTarget } from "@/lib/editor/keyboardShortcuts";
import type { ImageDimensions } from "@/types/editor";

const colors = {
  floor: "#0f766e",
  wall: "#2563eb",
  table: "#b45309",
  ceiling: "#7c3aed",
  free: "#475569",
};

export function SurfaceOverlay({
  dimensions,
  canvasScale,
}: {
  dimensions: ImageDimensions;
  canvasScale: number;
}) {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<
    | {
        kind: "point";
        pointerId: number;
        surfaceId: string;
        pointIndex: number;
      }
    | {
        kind: "surface";
        pointerId: number;
        surfaceId: string;
        lastPoint: { x: number; y: number };
      }
    | null
  >(null);
  const previousToolRef = useRef(editor.activeTool);
  const inverse = 1 / Math.max(canvasScale, 0.01);
  const fullInteractive =
    editor.activeTool === "define-surface" || editor.activeTool === "horizon";

  function imagePoint(event: ReactPointerEvent) {
    return ref.current
      ? clientPointToImagePoint(
          { x: event.clientX, y: event.clientY },
          ref.current.getBoundingClientRect(),
          dimensions,
        )
      : null;
  }

  function continueDrag(event: ReactPointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = imagePoint(event);
    if (!point) return;
    if (drag.kind === "point")
      placement.updateSurfacePoint(
        drag.surfaceId,
        drag.pointIndex,
        point,
        false,
      );
    else {
      placement.movePlacementSurface(
        drag.surfaceId,
        point.x - drag.lastPoint.x,
        point.y - drag.lastPoint.y,
        false,
      );
      drag.lastPoint = point;
    }
  }

  function finishDrag(event: ReactPointerEvent) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    placement.commitHistoryTransaction();
  }

  useEffect(() => {
    if (previousToolRef.current === editor.activeTool) return;
    previousToolRef.current = editor.activeTool;
    if (!dragRef.current) return;
    dragRef.current = null;
    placement.commitHistoryTransaction();
  }, [editor.activeTool, placement]);

  useEffect(() => {
    function keyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        isTypingTarget(event.target) ||
        editor.activeTool !== "define-surface"
      )
        return;
      if (event.key === "Enter") {
        event.preventDefault();
        placement.finishSurfaceDraft();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        placement.cancelSurfaceDraft();
      }
    }
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [editor.activeTool, placement]);

  const guide = placement.perspectiveGuide;
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-30"
      style={{
        pointerEvents: fullInteractive ? "auto" : "none",
        cursor: fullInteractive ? "crosshair" : undefined,
      }}
      onPointerDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const point = imagePoint(event);
        if (!point) return;
        if (editor.activeTool === "define-surface")
          placement.addSurfaceDraftPoint(point);
        else if (editor.activeTool === "horizon") {
          if (!guide || guide.vanishingPoint2)
            placement.setPerspectiveGuide({
              horizonY: point.y,
              vanishingPoint1: point,
              visible: true,
            });
          else
            placement.setPerspectiveGuide({
              ...guide,
              horizonY: point.y,
              vanishingPoint2: point,
              visible: true,
            });
        }
      }}
      onDoubleClick={(event) => {
        if (editor.activeTool === "define-surface") {
          event.preventDefault();
          placement.finishSurfaceDraft();
        }
      }}
      onPointerMove={continueDrag}
      onPointerUp={finishDrag}
      onPointerCancel={(event) => {
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        placement.commitHistoryTransaction();
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {placement.placementSurfaces
          .filter((surface) => surface.visible)
          .map((surface) => (
            <g key={surface.id}>
              <polygon
                data-placement-surface={surface.id}
                points={surface.points
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ")}
                fill={colors[surface.type]}
                fillOpacity={surface.selected ? 0.18 : 0.08}
                stroke={colors[surface.type]}
                strokeWidth={(surface.selected ? 2.5 : 1.4) * inverse}
                strokeDasharray={
                  surface.detected ? `${7 * inverse} ${5 * inverse}` : undefined
                }
                style={{ pointerEvents: "none" }}
              />
              {surface.selected &&
              !fullInteractive &&
              !placement.isPlacingObject &&
              !surface.locked ? (
                <polyline
                  points={[...surface.points, surface.points[0]]
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14 * inverse}
                  style={{ pointerEvents: "stroke", cursor: "move" }}
                  onPointerDown={(event) => {
                    const point = imagePoint(event);
                    if (!point) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragRef.current = {
                      kind: "surface",
                      pointerId: event.pointerId,
                      surfaceId: surface.id,
                      lastPoint: point,
                    };
                    placement.beginHistoryTransaction();
                  }}
                  onPointerMove={continueDrag}
                  onPointerUp={finishDrag}
                />
              ) : null}
              <text
                x={polygonCentroid(surface.points).x}
                y={polygonCentroid(surface.points).y}
                fill={colors[surface.type]}
                fontSize={12 * inverse}
                textAnchor="middle"
                className="pointer-events-none font-semibold"
              >
                {surface.name}
              </text>
            </g>
          ))}
        {placement.surfaceDraftPoints.length ? (
          <polyline
            points={placement.surfaceDraftPoints
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
            fill="none"
            stroke={colors[placement.surfaceDraftType]}
            strokeWidth={2 * inverse}
            strokeDasharray={`${6 * inverse} ${4 * inverse}`}
          />
        ) : null}
        {guide?.visible ? (
          <g
            stroke="#e11d48"
            strokeWidth={1.5 * inverse}
            strokeDasharray={`${8 * inverse} ${5 * inverse}`}
          >
            <line
              x1="0"
              y1={guide.horizonY}
              x2={dimensions.width}
              y2={guide.horizonY}
            />
            {guide.vanishingPoint1 ? (
              <>
                <line
                  x1={guide.vanishingPoint1.x}
                  y1={guide.vanishingPoint1.y}
                  x2="0"
                  y2={dimensions.height}
                />
                <line
                  x1={guide.vanishingPoint1.x}
                  y1={guide.vanishingPoint1.y}
                  x2={dimensions.width}
                  y2={dimensions.height}
                />
              </>
            ) : null}
            {guide.vanishingPoint2 ? (
              <>
                <line
                  x1={guide.vanishingPoint2.x}
                  y1={guide.vanishingPoint2.y}
                  x2="0"
                  y2={dimensions.height}
                />
                <line
                  x1={guide.vanishingPoint2.x}
                  y1={guide.vanishingPoint2.y}
                  x2={dimensions.width}
                  y2={dimensions.height}
                />
              </>
            ) : null}
          </g>
        ) : null}
      </svg>
      {!fullInteractive && !placement.isPlacingObject
        ? placement.placementSurfaces
            .filter(
              (surface) =>
                surface.visible && surface.selected && !surface.locked,
            )
            .flatMap((surface) =>
              surface.points.map((point, index) => (
                <button
                  key={`${surface.id}-${index}`}
                  type="button"
                  aria-label={`Mover punto ${index + 1} de ${surface.name}`}
                  className="object-transform-handle pointer-events-auto absolute rounded-full border-2 bg-white shadow"
                  style={
                    {
                      left: point.x,
                      top: point.y,
                      borderColor: colors[surface.type],
                      "--object-handle-size": `${11 * inverse}px`,
                      cursor: "move",
                    } as React.CSSProperties
                  }
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragRef.current = {
                      kind: "point",
                      pointerId: event.pointerId,
                      surfaceId: surface.id,
                      pointIndex: index,
                    };
                    placement.beginHistoryTransaction();
                  }}
                  onPointerMove={continueDrag}
                  onPointerUp={finishDrag}
                />
              )),
            )
        : null}
      {!fullInteractive && !placement.isPlacingObject
        ? placement.placementSurfaces
            .filter(
              (surface) =>
                surface.visible && surface.selected && !surface.locked,
            )
            .map((surface) => {
              const center = polygonCentroid(surface.points);
              return (
                <button
                  key={`move-${surface.id}`}
                  type="button"
                  aria-label={`Mover superficie completa ${surface.name}`}
                  className="object-transform-handle pointer-events-auto absolute grid place-items-center rounded-full border-2 bg-white text-[9px] font-bold shadow"
                  style={
                    {
                      left: center.x,
                      top: center.y,
                      borderColor: colors[surface.type],
                      "--object-handle-size": `${18 * inverse}px`,
                      cursor: "move",
                    } as React.CSSProperties
                  }
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragRef.current = {
                      kind: "surface",
                      pointerId: event.pointerId,
                      surfaceId: surface.id,
                      lastPoint: center,
                    };
                    placement.beginHistoryTransaction();
                  }}
                  onPointerMove={continueDrag}
                  onPointerUp={finishDrag}
                >
                  +
                </button>
              );
            })
        : null}
    </div>
  );
}
