"use client";

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
    activeTool,
    beforeAfterEnabled,
    maskPreviewEnabled,
    masks,
    selectMask,
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
          const showFill =
            maskPreviewEnabled && !beforeAfterEnabled && Boolean(mask.color);
          const showOutline = maskPreviewEnabled;
          const fillColor = showFill ? mask.color : "transparent";
          const strokeColor = isSelected ? "#2563eb" : "#f8fafc";
          const strokeWidth = isSelected ? 4 : 2;
          const commonProps = {
            fill: fillColor,
            fillOpacity: showFill ? mask.opacity : 0,
            stroke: showOutline ? strokeColor : "transparent",
            strokeDasharray: isSelected ? "0" : "10 8",
            strokeOpacity: showOutline ? 0.95 : 0,
            strokeWidth,
            vectorEffect: "non-scaling-stroke" as const,
            onClick: (event: React.MouseEvent<SVGElement>) => {
              if (activeTool === "select" || activeTool === "paint-wall") {
                event.stopPropagation();
                selectMask(mask.id);
              }
            },
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
