"use client";

import type { CSSProperties, MouseEvent } from "react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import type { ImageDimensions, WallMask } from "@/types/editor";

type MaskOverlayProps = {
  dimensions: ImageDimensions;
};

function polygonPoints(mask: WallMask) {
  return mask.points?.map((point) => `${point.x},${point.y}`).join(" ") ?? "";
}

export function MaskOverlay({ dimensions }: MaskOverlayProps) {
  const {
    activeColor,
    activeTool,
    beforeAfterEnabled,
    globalBlendMode,
    maskPreviewEnabled,
    masks,
    selectMask,
    updateMask,
  } = useEditor();

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      aria-hidden="true"
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
            if (activeTool !== "select" && activeTool !== "paint-wall") {
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
              activeTool === "select" || activeTool === "paint-wall"
                ? "cursor-pointer transition"
                : "pointer-events-none",
          };

          if (mask.path) {
            return <path key={mask.id} d={mask.path} {...commonProps} />;
          }

          return (
            <polygon
              key={mask.id}
              points={polygonPoints(mask)}
              {...commonProps}
            />
          );
        })}
    </svg>
  );
}
