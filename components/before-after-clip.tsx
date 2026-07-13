import type { ReactNode } from "react";
import type { ComparisonDirection } from "@/lib/canvas/canvasTransformUtils";

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
      style={{
        clipPath:
          direction === "vertical"
            ? `inset(0 calc(100% - var(--comparison-position, ${position}%)) 0 0)`
            : `inset(0 0 calc(100% - var(--comparison-position, ${position}%)) 0)`,
      }}
    >
      {children}
    </div>
  );
}
