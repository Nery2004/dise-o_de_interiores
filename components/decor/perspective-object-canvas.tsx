"use client";

import { useEffect, useMemo, useRef } from "react";
import { loadDecorAsset } from "@/lib/decor/loadDecorAsset";
import { renderProjectiveImage } from "@/lib/perspective/projectiveTransform";
import {
  perspectivePointsArray,
  polygonBounds,
} from "@/lib/perspective/surfaceGeometry";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function PerspectiveObjectCanvas({
  object,
  draft = false,
}: {
  object: PlacedDecorObject;
  draft?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bounds = useMemo(
    () => polygonBounds(perspectivePointsArray(object.perspectivePoints!)),
    [object.perspectivePoints],
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    const points = object.perspectivePoints;
    if (!canvas || !points) return;
    let cancelled = false;
    void loadDecorAsset(object.assetUrl)
      .then((image) => {
        if (cancelled) return;
        canvas.width = Math.max(1, Math.ceil(bounds.width));
        canvas.height = Math.max(1, Math.ceil(bounds.height));
        const context = canvas.getContext("2d");
        if (!context) return;
        context.globalAlpha = object.opacity;
        const source = document.createElement("canvas");
        source.width = Math.max(1, Math.round(object.width));
        source.height = Math.max(1, Math.round(object.height));
        const sourceContext = source.getContext("2d");
        if (!sourceContext) return;
        sourceContext.translate(
          object.flipX ? source.width : 0,
          object.flipY ? source.height : 0,
        );
        sourceContext.scale(object.flipX ? -1 : 1, object.flipY ? -1 : 1);
        sourceContext.drawImage(image, 0, 0, source.width, source.height);
        const local = {
          topLeft: {
            x: points.topLeft.x - bounds.left,
            y: points.topLeft.y - bounds.top,
          },
          topRight: {
            x: points.topRight.x - bounds.left,
            y: points.topRight.y - bounds.top,
          },
          bottomRight: {
            x: points.bottomRight.x - bounds.left,
            y: points.bottomRight.y - bounds.top,
          },
          bottomLeft: {
            x: points.bottomLeft.x - bounds.left,
            y: points.bottomLeft.y - bounds.top,
          },
        };
        renderProjectiveImage(
          context,
          source,
          source.width,
          source.height,
          local,
          draft ? "draft" : "high",
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [bounds.height, bounds.left, bounds.top, bounds.width, draft, object]);
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none block h-full w-full"
    />
  );
}
