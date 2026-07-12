import type { ReactNode } from "react";
import {
  getComparisonClipPath,
  type ComparisonDirection,
} from "@/lib/canvas/canvasTransformUtils";

export function BeforeAfterClip({
  children,
  direction,
  position,
}: {
  children: ReactNode;
  direction: ComparisonDirection;
  position: number;
}) {
  return (
    <div
      className="absolute inset-0"
      style={{ clipPath: getComparisonClipPath(direction, position) }}
    >
      {children}
    </div>
  );
}
