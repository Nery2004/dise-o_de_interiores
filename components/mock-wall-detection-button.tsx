"use client";

import { WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import type { ImageDimensions, WallMask } from "@/types/editor";

function createMaskId() {
  return globalThis.crypto?.randomUUID?.() ?? `mask-${Date.now()}`;
}

function createMockMasks(dimensions: ImageDimensions): WallMask[] {
  const { height, width } = dimensions;
  const createdAt = new Date().toISOString();

  return [
    {
      id: createMaskId(),
      name: "Pared izquierda",
      type: "auto",
      visible: true,
      selected: false,
      opacity: 0.38,
      points: [
        { x: width * 0.03, y: height * 0.17 },
        { x: width * 0.35, y: height * 0.08 },
        { x: width * 0.39, y: height * 0.75 },
        { x: width * 0.06, y: height * 0.88 },
      ],
      createdAt,
    },
    {
      id: createMaskId(),
      name: "Pared fondo",
      type: "auto",
      visible: true,
      selected: false,
      opacity: 0.36,
      points: [
        { x: width * 0.34, y: height * 0.08 },
        { x: width * 0.69, y: height * 0.1 },
        { x: width * 0.68, y: height * 0.72 },
        { x: width * 0.39, y: height * 0.75 },
      ],
      createdAt,
    },
    {
      id: createMaskId(),
      name: "Pared derecha",
      type: "auto",
      visible: true,
      selected: false,
      opacity: 0.34,
      points: [
        { x: width * 0.69, y: height * 0.1 },
        { x: width * 0.96, y: height * 0.2 },
        { x: width * 0.91, y: height * 0.87 },
        { x: width * 0.68, y: height * 0.72 },
      ],
      createdAt,
    },
  ];
}

export function MockWallDetectionButton() {
  const { addMask, clearMasks, dimensions, image } = useEditor();

  return (
    <button
      type="button"
      onClick={() => {
        if (!image || !dimensions) {
          toast.error("Primero sube una imagen.");
          return;
        }

        clearMasks();
        createMockMasks(dimensions).forEach(addMask);
        toast.success("Mascaras mock creadas.");
      }}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2421] px-3 text-sm font-semibold text-white transition hover:bg-[#343b36]"
    >
      <WandSparkles size={16} />
      Detectar paredes (mock)
    </button>
  );
}
