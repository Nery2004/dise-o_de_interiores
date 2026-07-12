"use client";

import Image from "next/image";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useMemo, useRef } from "react";
import { BeforeAfterClip } from "@/components/before-after-clip";
import { BrushRefinementOverlay } from "@/components/brush-refinement-overlay";
import { ComparisonHandle } from "@/components/comparison-handle";
import { ComparisonModeSelector } from "@/components/comparison-mode-selector";
import { DrawingHelpOverlay } from "@/components/drawing-help-overlay";
import { DecorObjectsLayer } from "@/components/decor/decor-objects-layer";
import { SurfaceOverlay } from "@/components/perspective/surface-overlay";
import { useComparison } from "@/components/comparison-context";
import { useEditor } from "@/components/editor-context";
import { ImageUploader } from "@/components/image-uploader";
import { MaskOverlay } from "@/components/mask-overlay";
import { PaintRenderer } from "@/components/paint-renderer";
import { ProposalComparisonGrid } from "@/components/proposal-comparison-grid";
import { RefinedMaskLayer } from "@/components/refined-mask-layer";
import { RenderedEditorImage } from "@/components/rendered-editor-image";
import { IndependentSideBySideComparison } from "@/components/side-by-side-comparison";
import { useCanvasTransform } from "@/components/use-canvas-transform";
import {
  CANVAS_MAX_SCALE,
  getCanvasTransformStyle,
  type ComparisonDirection,
} from "@/lib/canvas/canvasTransformUtils";
import type { ImageDimensions, LoadedImage } from "@/types/editor";
import { LightDirectionOverlay } from "@/components/lighting/light-direction-overlay";
import { RulersOverlay } from "@/components/decor/rulers-overlay";

const SIDE_BY_SIDE_GAP = 24;

function CanvasZoomControls({
  fitScale,
  onFit,
  onZoomBy,
  onZoomToActualSize,
  scale,
}: {
  fitScale: number;
  onFit: () => void;
  onZoomBy: (amount: number) => void;
  onZoomToActualSize: () => void;
  scale: number;
}) {
  return (
    <div
      data-canvas-control="true"
      className="absolute bottom-4 right-4 z-40 flex flex-wrap items-center justify-end gap-1 rounded-lg border border-[#dfe3e8] bg-white/95 p-1 shadow-lg backdrop-blur"
    >
      <button
        type="button"
        disabled={scale <= fitScale + 0.0001}
        onClick={() => onZoomBy(-0.1)}
        className="flex h-9 items-center gap-1 rounded px-2 text-xs font-semibold text-[#3b414a] transition hover:bg-[#eef1f4] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={15} /> Zoom -
      </button>
      <span className="min-w-12 px-1 text-center text-xs font-semibold tabular-nums text-[#69717d]">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        disabled={scale >= CANVAS_MAX_SCALE - 0.0001}
        onClick={() => onZoomBy(0.1)}
        className="flex h-9 items-center gap-1 rounded px-2 text-xs font-semibold text-[#3b414a] transition hover:bg-[#eef1f4] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={15} /> Zoom +
      </button>
      <button
        type="button"
        onClick={onFit}
        className="flex h-9 items-center gap-1 rounded px-2 text-xs font-semibold text-[#3b414a] transition hover:bg-[#eef1f4]"
      >
        <Maximize2 size={15} /> Ajustar a pantalla
      </button>
      <button
        type="button"
        onClick={onZoomToActualSize}
        className="h-9 rounded px-2 text-xs font-semibold text-[#3b414a] transition hover:bg-[#eef1f4]"
      >
        100 %
      </button>
    </div>
  );
}

function ComparisonLabels({
  direction,
  scale,
}: {
  direction: ComparisonDirection;
  scale: number;
}) {
  const inverseScale = 1 / Math.max(scale, Number.EPSILON);
  return (
    <>
      <span
        className="pointer-events-none absolute left-3 top-3 z-20 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white"
        style={{ transform: `scale(${inverseScale})`, transformOrigin: "top left" }}
      >
        Editada
      </span>
      <span
        className="pointer-events-none absolute bottom-3 right-3 z-20 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white"
        style={{
          transform: `scale(${inverseScale})`,
          transformOrigin: "bottom right",
        }}
      >
        Original
      </span>
      <span className="sr-only">
        Comparación {direction === "vertical" ? "vertical" : "horizontal"}
      </span>
    </>
  );
}

function SideBySideStage({ image }: { image: LoadedImage }) {
  return (
    <>
      <div
        className="absolute left-0 top-0 overflow-hidden bg-black shadow-2xl"
        style={{ width: image.dimensions.width, height: image.dimensions.height }}
      >
        <Image
          src={image.url}
          alt="Original"
          fill
          unoptimized
          className="canvas-fixed-image object-contain"
          draggable={false}
        />
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white">
          Original
        </span>
      </div>
      <div
        className="absolute right-0 top-0 overflow-hidden bg-black shadow-2xl"
        style={{ width: image.dimensions.width, height: image.dimensions.height }}
      >
        <RenderedEditorImage />
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white">
          Editada
        </span>
      </div>
    </>
  );
}

function TransformedCanvas({ image }: { image: LoadedImage }) {
  const editor = useEditor();
  const comparison = useComparison();
  const stageRef = useRef<HTMLDivElement>(null);
  const isSideBySide = comparison.mode === "side-by-side";
  const stageDimensions = useMemo<ImageDimensions>(
    () =>
      isSideBySide
        ? {
            width: image.dimensions.width * 2 + SIDE_BY_SIDE_GAP,
            height: image.dimensions.height,
          }
        : image.dimensions,
    [image.dimensions, isSideBySide],
  );
  const {
    fitImageToViewport,
    fitScale,
    handleWheel,
    interactionMode,
    transform,
    viewportPointerHandlers,
    viewportRef,
    zoomBy,
    zoomToActualSize,
  } = useCanvasTransform({
    activeTool: editor.activeTool,
    imageDimensions: stageDimensions,
    resetKey: image.url,
    onScaleChange: editor.setZoom,
  });
  const comparisonDirection: ComparisonDirection | null =
    comparison.mode === "slider" || comparison.mode === "split-vertical"
      ? "vertical"
      : comparison.mode === "split-horizontal"
        ? "horizontal"
        : null;
  const stageStyle = getCanvasTransformStyle(transform);
  const panEnabled = editor.activeTool === "pan";
  const cursor = panEnabled
    ? interactionMode === "panning"
      ? "grabbing"
      : "grab"
    : editor.activeTool === "zoom"
      ? "zoom-in"
      : "default";

  const editedLayers = (
    <>
      <PaintRenderer />
      <RefinedMaskLayer dimensions={image.dimensions} />
      <MaskOverlay dimensions={image.dimensions} />
      <DecorObjectsLayer key={editor.activeTool} dimensions={image.dimensions} canvasScale={transform.scale} />
      <SurfaceOverlay dimensions={image.dimensions} canvasScale={transform.scale} />
      <LightDirectionOverlay dimensions={image.dimensions} />
      <RulersOverlay dimensions={image.dimensions} />
      <BrushRefinementOverlay dimensions={image.dimensions} />
    </>
  );

  return (
    <div
      ref={viewportRef}
      className="absolute inset-0 overflow-hidden overscroll-contain"
      style={{
        cursor,
        touchAction: panEnabled ? "none" : "pan-y",
        userSelect: panEnabled ? "none" : undefined,
      }}
      onWheel={handleWheel}
      onDragStart={(event) => event.preventDefault()}
      {...viewportPointerHandlers}
    >
      <CanvasZoomControls
        fitScale={fitScale}
        onFit={fitImageToViewport}
        onZoomBy={zoomBy}
        onZoomToActualSize={zoomToActualSize}
        scale={transform.scale}
      />
      <div className="absolute left-4 top-4 z-20 rounded-md border border-[#dfe3e8] bg-white/95 px-3 py-2 text-xs font-semibold text-[#3b414a] shadow-sm backdrop-blur">
        {comparison.mode === "original"
          ? "Vista original"
          : comparison.mode === "side-by-side"
            ? "Original | Editada"
            : "Vista editada"}
      </div>
      <DrawingHelpOverlay />

      <div
        ref={stageRef}
        data-canvas-stage="true"
        className="absolute left-1/2 top-1/2 shrink-0 select-none shadow-2xl"
        style={{
          ...stageStyle,
          width: stageDimensions.width,
          height: stageDimensions.height,
          marginLeft: -stageDimensions.width / 2,
          marginTop: -stageDimensions.height / 2,
          transition:
            interactionMode === "idle"
              ? "transform 120ms ease-out"
              : undefined,
          willChange: "transform",
          backgroundColor: editor.maskOnlyPreview ? "#20242a" : undefined,
          backgroundImage: editor.maskOnlyPreview
            ? "linear-gradient(45deg,#2d333b 25%,transparent 25%),linear-gradient(-45deg,#2d333b 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2d333b 75%),linear-gradient(-45deg,transparent 75%,#2d333b 75%)"
            : undefined,
          backgroundSize: editor.maskOnlyPreview ? "32px 32px" : undefined,
          backgroundPosition: editor.maskOnlyPreview
            ? "0 0,0 16px,16px -16px,-16px 0"
            : undefined,
        }}
      >
        {isSideBySide ? (
          <SideBySideStage image={image} />
        ) : (
          <>
            <Image
              src={image.url}
              alt={image.name}
              width={image.dimensions.width}
              height={image.dimensions.height}
              unoptimized
              className="canvas-fixed-image pointer-events-none block h-full w-full"
              style={{ opacity: editor.maskOnlyPreview ? 0 : 1 }}
              draggable={false}
              priority
            />
            {comparison.mode !== "original" ? (
              comparisonDirection ? (
                <BeforeAfterClip
                  direction={comparisonDirection}
                  position={comparison.comparisonPosition}
                >
                  {editedLayers}
                </BeforeAfterClip>
              ) : (
                <div className="absolute inset-0">{editedLayers}</div>
              )
            ) : null}
            {comparisonDirection ? (
              <>
                <ComparisonLabels
                  direction={comparisonDirection}
                  scale={transform.scale}
                />
                <ComparisonHandle
                  containerRef={stageRef}
                  direction={comparisonDirection}
                  disabled={panEnabled}
                  position={comparison.comparisonPosition}
                  onPositionChange={comparison.setComparisonPosition}
                  scale={transform.scale}
                />
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function CanvasViewer() {
  const { image } = useEditor();
  const comparison = useComparison();

  if (!image) {
    return (
      <section className="min-h-[480px] min-w-0">
        <ImageUploader />
      </section>
    );
  }

  return (
    <section className="relative min-h-[480px] min-w-0 overflow-hidden rounded-lg border border-[#dde1e7] bg-[#e8ebef] shadow-sm">
      <ComparisonModeSelector />
      {comparison.mode === "proposals" ? (
        <ProposalComparisonGrid />
      ) : comparison.mode === "side-by-side" && !comparison.syncViews ? (
        <IndependentSideBySideComparison />
      ) : (
        <TransformedCanvas image={image} />
      )}
    </section>
  );
}
