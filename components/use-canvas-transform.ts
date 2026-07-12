"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  calculateFitScale,
  clampTranslation,
  clampZoom,
  type CanvasTransform,
  type ViewportSize,
} from "@/lib/canvas/canvasTransformUtils";
import type { EditorTool, ImageDimensions } from "@/types/editor";

export type InteractionMode =
  | "idle"
  | "panning"
  | "comparing"
  | "editing-point"
  | "drawing-mask"
  | "refining-mask"
  | "placing-object"
  | "moving-object"
  | "resizing-object"
  | "rotating-object";

type PanState = {
  pointerId: number;
  clientX: number;
  clientY: number;
  transform: CanvasTransform;
};

type UseCanvasTransformOptions = {
  activeTool: EditorTool;
  imageDimensions: ImageDimensions;
  resetKey: string;
  onScaleChange?: (scale: number) => void;
};

const INITIAL_TRANSFORM: CanvasTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

function isCanvasControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-canvas-control='true']"))
  );
}

export function useCanvasTransform({
  activeTool,
  imageDimensions,
  resetKey,
  onScaleChange,
}: UseCanvasTransformOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [transform, setTransform] =
    useState<CanvasTransform>(INITIAL_TRANSFORM);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>("idle");
  const manualZoomRef = useRef(false);
  const manualPanRef = useRef(false);
  const previousResetKeyRef = useRef<string | null>(null);
  const panRef = useRef<PanState | null>(null);
  const onScaleChangeRef = useRef(onScaleChange);

  const fitScale = calculateFitScale(viewportSize, imageDimensions);

  useEffect(() => {
    onScaleChangeRef.current = onScaleChange;
  }, [onScaleChange]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateSize = () => {
      const bounds = viewport.getBoundingClientRect();
      setViewportSize((current) => {
        if (current.width === bounds.width && current.height === bounds.height) {
          return current;
        }
        return { width: bounds.width, height: bounds.height };
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) return;
    const imageChanged = previousResetKeyRef.current !== resetKey;
    previousResetKeyRef.current = resetKey;

    if (imageChanged) {
      manualZoomRef.current = false;
      manualPanRef.current = false;
      panRef.current = null;
      setInteractionMode("idle");
    }

    setTransform((current) => {
      if (imageChanged || (!manualZoomRef.current && !manualPanRef.current)) {
        return { scale: fitScale, translateX: 0, translateY: 0 };
      }

      return clampTranslation(
        {
          ...current,
          scale: manualZoomRef.current
            ? clampZoom(current.scale, fitScale)
            : fitScale,
        },
        viewportSize,
        imageDimensions,
      );
    });
  }, [fitScale, imageDimensions, resetKey, viewportSize]);

  useEffect(() => {
    onScaleChangeRef.current?.(transform.scale);
  }, [transform.scale]);

  const fitImageToViewport = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const nextViewport = { width: bounds.width, height: bounds.height };
    const nextFitScale = calculateFitScale(nextViewport, imageDimensions);
    manualZoomRef.current = false;
    manualPanRef.current = false;
    setViewportSize(nextViewport);
    setTransform({
      scale: nextFitScale,
      translateX: 0,
      translateY: 0,
    });
  }, [imageDimensions]);

  const zoomTo = useCallback(
    (requestedScale: number, clientPoint?: { x: number; y: number }) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const bounds = viewport.getBoundingClientRect();
      const nextViewport = { width: bounds.width, height: bounds.height };
      const nextFitScale = calculateFitScale(nextViewport, imageDimensions);
      const nextScale = clampZoom(requestedScale, nextFitScale);
      manualZoomRef.current = Math.abs(nextScale - nextFitScale) > 0.0001;

      setViewportSize(nextViewport);
      setTransform((current) => {
        if (Math.abs(nextScale - nextFitScale) <= 0.0001) {
          manualPanRef.current = false;
          return { scale: nextFitScale, translateX: 0, translateY: 0 };
        }
        const focalPoint = clientPoint ?? {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        };
        const focalX = focalPoint.x - bounds.left - bounds.width / 2;
        const focalY = focalPoint.y - bounds.top - bounds.height / 2;
        const ratio = nextScale / current.scale;
        return clampTranslation(
          {
            scale: nextScale,
            translateX: focalX - (focalX - current.translateX) * ratio,
            translateY: focalY - (focalY - current.translateY) * ratio,
          },
          nextViewport,
          imageDimensions,
        );
      });
    },
    [imageDimensions],
  );

  const zoomBy = useCallback(
    (amount: number) => zoomTo(transform.scale + amount),
    [transform.scale, zoomTo],
  );

  const zoomToActualSize = useCallback(() => zoomTo(1), [zoomTo]);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (activeTool !== "zoom" && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const amount = Math.max(-0.15, Math.min(0.15, -event.deltaY * 0.0015));
      if (Math.abs(amount) < 0.001) return;
      zoomTo(transform.scale + amount, { x: event.clientX, y: event.clientY });
    },
    [activeTool, transform.scale, zoomTo],
  );

  const finishPan = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId) return;
      panRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setInteractionMode("idle");
    },
    [],
  );

  const viewportPointerHandlers = {
    onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
      if (
        activeTool !== "pan" ||
        event.button !== 0 ||
        isCanvasControl(event.target)
      ) {
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      panRef.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        transform,
      };
      setInteractionMode("panning");
    },
    onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
      const pan = panRef.current;
      if (
        activeTool !== "pan" ||
        !pan ||
        pan.pointerId !== event.pointerId
      ) {
        return;
      }
      event.preventDefault();
      manualPanRef.current = true;
      setTransform(
        clampTranslation(
          {
            ...pan.transform,
            translateX: pan.transform.translateX + event.clientX - pan.clientX,
            translateY: pan.transform.translateY + event.clientY - pan.clientY,
          },
          viewportSize,
          imageDimensions,
        ),
      );
    },
    onPointerUp: finishPan,
    onPointerCancel: finishPan,
    onLostPointerCapture(event: ReactPointerEvent<HTMLDivElement>) {
      if (panRef.current?.pointerId === event.pointerId) {
        panRef.current = null;
        setInteractionMode("idle");
      }
    },
  };

  return {
    fitImageToViewport,
    fitScale,
    handleWheel,
    interactionMode,
    transform,
    viewportPointerHandlers,
    viewportRef: viewportRef as RefObject<HTMLDivElement>,
    viewportSize,
    zoomBy,
    zoomToActualSize,
  };
}
