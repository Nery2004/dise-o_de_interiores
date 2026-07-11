"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { ManualMaskDrawer } from "@/components/manual-mask-drawer";
import { EditableMaskOverlay } from "@/components/editable-mask-overlay";
import { useEditor } from "@/components/editor-context";
import { pointsToSvgString } from "@/lib/mask-geometry";
import type { ImageDimensions, ImagePoint } from "@/types/editor";

type MaskOverlayProps = {
  dimensions: ImageDimensions;
};

function getSvgPoint(
  event: MouseEvent<SVGSVGElement>,
  dimensions: ImageDimensions,
) {
  const svg = event.currentTarget;
  const matrix = svg.getScreenCTM()?.inverse();

  if (!matrix) {
    return null;
  }

  const svgPoint = svg.createSVGPoint();
  svgPoint.x = event.clientX;
  svgPoint.y = event.clientY;
  const point = svgPoint.matrixTransform(matrix);

  return {
    x: Math.min(Math.max(point.x, 0), dimensions.width),
    y: Math.min(Math.max(point.y, 0), dimensions.height),
  };
}

function distanceBetween(first: ImagePoint, second: ImagePoint) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function MaskOverlay({ dimensions }: MaskOverlayProps) {
  const {
    activeColor,
    activeTool,
    addManualPoint,
    beforeAfterEnabled,
    cancelManualMask,
    cursorPreviewPoint,
    finishManualMask,
    globalBlendMode,
    isDrawingMask,
    maskPreviewEnabled,
    manualPoints,
    masks,
    selectMask,
    selectedMaskId,
    setCursorPreviewPoint,
    updateMask,
    zoom,
    clearSelectedPoints,
  } = useEditor();
  const isManualSelection = activeTool === "manual-select";
  const closeThreshold = Math.max(8, 16 / zoom);

  useEffect(() => {
    if (!isManualSelection) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        finishManualMask();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelManualMask();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelManualMask, finishManualMask, isManualSelection]);

  return (
    <svg
      className={
        isManualSelection
          ? "absolute inset-0 h-full w-full cursor-crosshair"
          : "absolute inset-0 h-full w-full"
      }
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      aria-hidden="true"
      onClick={(event) => {
        if (activeTool === "edit-mask") {
          clearSelectedPoints();
          return;
        }
        if (!isManualSelection) {
          return;
        }

        const point = getSvgPoint(event, dimensions);
        const firstPoint = manualPoints[0];

        if (!point) {
          return;
        }

        if (
          firstPoint &&
          distanceBetween(point, firstPoint) <= closeThreshold
        ) {
          finishManualMask();
          return;
        }

        addManualPoint(point);
      }}
      onMouseMove={(event) => {
        if (!isManualSelection || manualPoints.length === 0) {
          return;
        }

        setCursorPreviewPoint(getSvgPoint(event, dimensions));
      }}
      onMouseLeave={() => {
        if (isManualSelection) {
          setCursorPreviewPoint(null);
        }
      }}
    >
      {masks
        .filter((mask) => mask.visible)
        .map((mask) => {
          const isSelected = mask.selected;
          const hasColor = Boolean(mask.color);
          const showPaintFill = hasColor && !beforeAfterEnabled;
          const showPreviewFill =
            !hasColor && maskPreviewEnabled && !beforeAfterEnabled;
          const showOutline = maskPreviewEnabled;
          const fillColor = showPaintFill
            ? mask.color
            : showPreviewFill
              ? "#7aa7d9"
              : "transparent";
          const strokeColor = isSelected ? "#2563eb" : "#f8fafc";
          const strokeWidth = isSelected ? 4 : 2;
          const fillOpacity = showPaintFill
            ? mask.opacity
            : showPreviewFill
              ? 0.22
              : 0;
          const style: CSSProperties = showPaintFill
            ? {
                mixBlendMode: mask.blendMode ?? globalBlendMode,
              }
            : {};
          const handleClick = (event: MouseEvent<SVGElement>) => {
            if (activeTool !== "select" && activeTool !== "paint-wall" && activeTool !== "edit-mask") {
              return;
            }

            event.stopPropagation();
            selectMask(mask.id);

            if (activeTool === "paint-wall") {
              if (!activeColor) {
                toast.error("Elige un color primero.");
                return;
              }

              updateMask(mask.id, {
                color: activeColor,
                blendMode: mask.blendMode ?? globalBlendMode,
              });
            }
          };
          const commonProps = {
            fill: fillColor,
            fillOpacity,
            stroke: showOutline ? strokeColor : "transparent",
            strokeDasharray: hasColor || isSelected ? "0" : "10 8",
            strokeOpacity: showOutline ? 0.95 : 0,
            strokeWidth,
            style,
            vectorEffect: "non-scaling-stroke" as const,
            onClick: handleClick,
            className:
              activeTool === "select" || activeTool === "paint-wall" || activeTool === "edit-mask"
                ? "cursor-pointer transition"
                : "pointer-events-none",
          };

          if (mask.path) {
            return <path key={mask.id} d={mask.path} {...commonProps} />;
          }

          return (
            <polygon
              key={mask.id}
              points={pointsToSvgString(mask)}
              {...commonProps}
            />
          );
        })}
      {isManualSelection ? (
        <ManualMaskDrawer
          closeThreshold={closeThreshold}
          cursorPreviewPoint={cursorPreviewPoint}
          isDrawing={isDrawingMask}
          points={manualPoints}
        />
      ) : null}
      {activeTool === "edit-mask" ? (() => {
        const selectedMask = masks.find((mask) => mask.id === selectedMaskId);
        return selectedMask?.points ? (
          <EditableMaskOverlay dimensions={dimensions} mask={selectedMask} />
        ) : null;
      })() : null}
    </svg>
  );
}
