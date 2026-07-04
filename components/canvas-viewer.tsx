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

export function CanvasViewer() {
  const { image, setZoom } = useEditor();

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
        initialScale={1}
        minScale={0.1}
        maxScale={8}
        wheel={{ step: 0.08 }}
        doubleClick={{ disabled: true }}
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

            <TransformComponent
              wrapperClass="!h-full !w-full"
              contentClass="!h-full !w-full"
            >
              <div className="flex h-full min-h-[480px] w-full items-center justify-center p-8">
                <Image
                  src={image.url}
                  alt={image.name}
                  width={image.dimensions.width}
                  height={image.dimensions.height}
                  unoptimized
                  className="h-auto max-h-none w-auto max-w-none select-none shadow-2xl"
                  draggable={false}
                  priority
                />
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </section>
  );
}
