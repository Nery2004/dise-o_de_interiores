"use client";

import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { useEditor } from "@/components/editor-context";
import { MaskControlPoint } from "@/components/mask-control-point";
import {
  clampPointToImage,
  clonePoints,
  findNearestPolygonEdge,
  insertPointBetween,
  movePolygonWithinImage,
} from "@/lib/geometry/maskGeometry";
import type { ImageDimensions, ImagePoint, WallMask } from "@/types/editor";

type EditableMaskOverlayProps = {
  dimensions: ImageDimensions;
  mask: WallMask;
};

function eventToImagePoint(event: PointerEvent<SVGElement> | MouseEvent<SVGElement>, dimensions: ImageDimensions) {
  const svg = event.currentTarget.ownerSVGElement;
  const matrix = svg?.getScreenCTM()?.inverse();
  if (!svg || !matrix) return null;
  const svgPoint = svg.createSVGPoint();
  svgPoint.x = event.clientX;
  svgPoint.y = event.clientY;
  const point = svgPoint.matrixTransform(matrix);
  return clampPointToImage(point, dimensions);
}

type DragState = {
  pointerId: number;
  start: ImagePoint;
  initialPoints: ImagePoint[];
  pointIndex?: number;
};

export function EditableMaskOverlay({ dimensions, mask }: EditableMaskOverlayProps) {
  const {
    moveWholeMask,
    selectedPointIndexes,
    setSelectedPointIndexes,
    updateMaskPoints,
    zoom,
  } = useEditor();
  const [draftPoints, setDraftPoints] = useState(() => clonePoints(mask.points) ?? []);
  const draftPointsRef = useRef(draftPoints);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    if (!dragRef.current) {
      const points = clonePoints(mask.points) ?? [];
      draftPointsRef.current = points;
      setDraftPoints(points);
    }
  }, [mask.points]);

  function beginPointDrag(event: PointerEvent<SVGCircleElement>, pointIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    const start = eventToImagePoint(event, dimensions);
    if (!start) return;
    const nextSelection = event.shiftKey
      ? selectedPointIndexes.includes(pointIndex)
        ? selectedPointIndexes.filter((index) => index !== pointIndex)
        : [...selectedPointIndexes, pointIndex]
      : selectedPointIndexes.includes(pointIndex)
        ? selectedPointIndexes
        : [pointIndex];
    setSelectedPointIndexes(nextSelection);
    if (event.shiftKey && selectedPointIndexes.includes(pointIndex)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, start, initialPoints: clonePoints(draftPoints) ?? [], pointIndex };
  }

  function beginMaskDrag(event: PointerEvent<SVGPolygonElement>) {
    if (!moveWholeMask) return;
    event.preventDefault();
    event.stopPropagation();
    const start = eventToImagePoint(event, dimensions);
    if (!start) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, start, initialPoints: clonePoints(draftPoints) ?? [] };
  }

  function continueDrag(event: PointerEvent<SVGElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = eventToImagePoint(event, dimensions);
    if (!current) return;
    const delta = { x: current.x - drag.start.x, y: current.y - drag.start.y };

    if (drag.pointIndex === undefined) {
      const points = movePolygonWithinImage(drag.initialPoints, delta, dimensions);
      draftPointsRef.current = points;
      setDraftPoints(points);
      return;
    }

    const indexes = selectedPointIndexes.includes(drag.pointIndex)
      ? selectedPointIndexes
      : [drag.pointIndex];
    const points = drag.initialPoints.map((point, index) => indexes.includes(index)
      ? clampPointToImage({ x: point.x + delta.x, y: point.y + delta.y }, dimensions)
      : point);
    draftPointsRef.current = points;
    setDraftPoints(points);
  }

  function finishDrag(event: PointerEvent<SVGElement>) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    updateMaskPoints(mask.id, draftPointsRef.current);
  }

  return (
    <g
      onClick={(event) => event.stopPropagation()}
      onPointerMove={continueDrag}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <polygon
        points={draftPoints.map((point) => `${point.x},${point.y}`).join(" ")}
        fill="transparent"
        stroke="#2563eb"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
        className={moveWholeMask ? "cursor-move" : "cursor-crosshair"}
        onPointerDown={beginMaskDrag}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (moveWholeMask) return;
          const point = eventToImagePoint(event, dimensions);
          if (!point) return;
          const edge = findNearestPolygonEdge(draftPoints, point);
          if (!edge || edge.distance > 14 / zoom) return;
          const next = insertPointBetween(draftPoints, edge.startIndex, edge.point);
          draftPointsRef.current = next;
          setDraftPoints(next);
          setSelectedPointIndexes([edge.startIndex + 1]);
          updateMaskPoints(mask.id, next);
        }}
      />
      {!moveWholeMask ? draftPoints.map((point, index) => (
        <MaskControlPoint
          key={index}
          index={index}
          point={point}
          selected={selectedPointIndexes.includes(index)}
          zoom={zoom}
          onPointerDown={beginPointDrag}
        />
      )) : null}
    </g>
  );
}
