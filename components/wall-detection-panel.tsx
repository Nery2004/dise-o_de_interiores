"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { detectWalls, type WallDetectionMode } from "@/lib/wallDetection";
import type { WallDetectionResult } from "@/lib/wallDetection/types";
import type { WallMask } from "@/types/editor";

function detectionResultToMask(result: WallDetectionResult): WallMask {
  return {
    id: result.id,
    name: result.name,
    type: "auto",
    confidence: result.confidence,
    visible: true,
    selected: false,
    opacity: 0.45,
    points: result.points,
    createdAt: new Date().toISOString(),
  };
}

export function WallDetectionPanel() {
  const {
    dimensions,
    originalFile,
    replaceMasks,
    setStatus,
    status,
  } = useEditor();
  const [provider, setProvider] = useState<WallDetectionMode>("mock");
  const isDetecting = status === "detecting";

  async function handleDetectWalls() {
    if (!originalFile || !dimensions) {
      toast.error("Primero sube una imagen.");
      return;
    }

    try {
      setStatus("detecting");
      const results = await detectWalls({
        imageFile: originalFile,
        imageDimensions: dimensions,
        provider,
      });

      replaceMasks(results.map(detectionResultToMask));
      toast.success("Paredes detectadas correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron detectar paredes.",
      );
    } finally {
      setStatus("ready");
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">
          Modo
        </span>
        <select
          value={provider}
          onChange={(event) =>
            setProvider(event.target.value as WallDetectionMode)
          }
          className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm text-[#202124] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
        >
          <option value="mock">Desarrollo Mock</option>
          <option value="ai">IA real</option>
        </select>
      </label>

      <button
        type="button"
        onClick={() => void handleDetectWalls()}
        disabled={isDetecting}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2421] px-3 text-sm font-semibold text-white transition hover:bg-[#343b36] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <WandSparkles size={16} />
        {isDetecting ? "Detectando..." : "Detectar paredes"}
      </button>
    </div>
  );
}
