"use client";

import Image from "next/image";
import { Maximize2, Minus, Plus } from "lucide-react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { useEditor } from "@/components/editor-context";
import { ImageUploader } from "@/components/image-uploader";
import { MaskOverlay } from "@/components/mask-overlay";
import { DrawingHelpOverlay } from "@/components/drawing-help-overlay";
import { BrushRefinementOverlay } from "@/components/brush-refinement-overlay";
import { RefinedMaskLayer } from "@/components/refined-mask-layer";

export function CanvasViewer() {
  const { activeTool, beforeAfterEnabled, image, maskOnlyPreview, setZoom, zoom } = useEditor();
  const isBrushTool = activeTool === "add-to-mask" || activeTool === "remove-from-mask";

  if (!image) {
    return (
      <section className="min-h-[480px] min-w-0">
        <ImageUploader />
      </section>
    );
  }

  return (
    <section className="relative min-h-[480px] min-w-0 overflow-hidden rounded-lg border border-[#dde1e7] bg-[#e8ebef] shadow-sm">
      <TransformWrapper
        key={image.url}
        centerOnInit
        initialScale={zoom}
        minScale={0.1}
        maxScale={8}
        wheel={{ step: 0.08 }}
        doubleClick={{ disabled: true }}
        panning={{ disabled: activeTool === "edit-mask" || activeTool === "manual-select" || isBrushTool }}
        onTransform={(_, state) => setZoom(state.scale)}
      >
        {(controls: ReactZoomPanPinchRef) => (
          <>
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md border border-[#dfe3e8] bg-white/95 p-1 shadow-sm backdrop-blur">
              <button
                type="button"
                aria-label="Alejar"
                onClick={() => controls.zoomOut(0.25)}
                className="grid h-9 w-9 place-items-center rounded text-[#3b414a] transition hover:bg-[#eef1f4]"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                aria-label="Acercar"
                onClick={() => controls.zoomIn(0.25)}
                className="grid h-9 w-9 place-items-center rounded text-[#3b414a] transition hover:bg-[#eef1f4]"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                aria-label="Ajustar al centro"
                onClick={() => controls.centerView(1)}
                className="grid h-9 w-9 place-items-center rounded text-[#3b414a] transition hover:bg-[#eef1f4]"
              >
                <Maximize2 size={16} />
              </button>
            </div>
            <div className="absolute left-4 top-4 z-10 rounded-md border border-[#dfe3e8] bg-white/95 px-3 py-2 text-xs font-semibold text-[#3b414a] shadow-sm backdrop-blur">
              {beforeAfterEnabled ? "Vista original" : "Vista editada"}
            </div>
            <DrawingHelpOverlay />

            <TransformComponent
              wrapperClass="!h-full !w-full"
              contentClass="!h-full !w-full"
            >
              <div className="flex h-full min-h-[480px] w-full items-center justify-center p-8">
                <div
                  className="relative shrink-0 shadow-2xl"
                  style={{
                    width: image.dimensions.width,
                    height: image.dimensions.height,
                    backgroundColor: maskOnlyPreview ? "#20242a" : undefined,
                    backgroundImage: maskOnlyPreview ? "linear-gradient(45deg,#2d333b 25%,transparent 25%),linear-gradient(-45deg,#2d333b 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2d333b 75%),linear-gradient(-45deg,transparent 75%,#2d333b 75%)" : undefined,
                    backgroundSize: maskOnlyPreview ? "32px 32px" : undefined,
                    backgroundPosition: maskOnlyPreview ? "0 0,0 16px,16px -16px,-16px 0" : undefined,
                  }}
                >
                  <Image
                    src={image.url}
                    alt={image.name}
                    width={image.dimensions.width}
                    height={image.dimensions.height}
                    unoptimized
                    className="block h-full w-full select-none"
                    style={{ opacity: maskOnlyPreview ? 0 : 1 }}
                    draggable={false}
                    priority
                  />
                  <RefinedMaskLayer dimensions={image.dimensions} />
                  <MaskOverlay dimensions={image.dimensions} />
                  <BrushRefinementOverlay dimensions={image.dimensions} />
                </div>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </section>
  );
}
