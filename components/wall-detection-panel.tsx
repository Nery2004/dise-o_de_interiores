"use client";

import { useEffect, useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { detectWalls, type WallDetectionMode } from "@/lib/wallDetection";
import type { WallDetectionDebugRegion, WallDetectionMetrics, WallDetectionResult } from "@/lib/wallDetection/types";
import type { WallMask } from "@/types/editor";

function detectionResultToMask(result: WallDetectionResult): WallMask {
  return {
    id: result.id,
    name: result.name,
    type: "auto",
    confidence: result.confidence,
    qualityScore: result.qualityScore,
    visible: true,
    selected: false,
    opacity: 0.45,
    points: result.points,
    createdAt: new Date().toISOString(),
  };
}

const providers: Array<{ value: WallDetectionMode; label: string }> = [
  { value: "mock", label: "Mock raster" }, { value: "ai", label: "Proveedor configurado" },
  { value: "sam2", label: "SAM2" }, { value: "florence-2", label: "Florence-2" },
  { value: "grounding-dino", label: "GroundingDINO" }, { value: "roboflow", label: "Roboflow" },
  { value: "yolo-segmentation", label: "YOLO Segmentation" }, { value: "custom", label: "Personalizado" },
];

function decodeRle(rle: number[], size: number) {
  const data = new Uint8Array(size);
  let value = rle[0] ?? 0;
  let offset = 0;
  for (let index = 1; index < rle.length; index += 2) {
    const length = rle[index] ?? 0;
    data.fill(value, offset, Math.min(size, offset + length));
    offset += length;
    value = rle[index + 1] ?? value;
  }
  return data;
}

function DebugPreview({ region, stage }: { region: WallDetectionDebugRegion; stage: "binary" | "contour" | "polygon" | "refined" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.width = region.width; canvas.height = region.height;
    const image = context.createImageData(region.width, region.height);
    const mask = decodeRle(region.binaryMaskRle, region.width * region.height);
    for (let index = 0; index < mask.length; index += 1) { const tone = mask[index] ? 38 : 245; image.data.set([tone, mask[index] ? 99 : 245, mask[index] ? 235 : 245, 255], index * 4); }
    context.putImageData(image, 0, 0);
    const points = stage === "contour" ? region.contour : stage === "polygon" ? region.polygon : stage === "refined" ? region.refined : [];
    if (points.length) {
      context.strokeStyle = stage === "refined" ? "#16a34a" : "#f97316"; context.lineWidth = Math.max(1, region.width / 180); context.beginPath();
      points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y)); context.closePath(); context.stroke();
    }
  }, [region, stage]);
  return <canvas ref={ref} className="h-20 w-full rounded border border-[#dfe3e8] object-contain [image-rendering:pixelated]" />;
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
  const [maskSmoothness, setMaskSmoothness] = useState(0.45);
  const [polygonTolerance, setPolygonTolerance] = useState(1.8);
  const [metrics, setMetrics] = useState<WallDetectionMetrics | null>(null);
  const [debugRegions, setDebugRegions] = useState<WallDetectionDebugRegion[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [wallScores, setWallScores] = useState<Array<Pick<WallDetectionResult, "id" | "name" | "confidence" | "qualityScore">>>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const isDetecting = status === "detecting";

  async function handleDetectWalls() {
    if (!originalFile || !dimensions) {
      toast.error("Primero sube una imagen.");
      return;
    }

    try {
      const controller = new AbortController();
      controllerRef.current = controller;
      setMetrics(null);
      setDebugRegions([]);
      setWallScores([]);
      setActiveProvider(null);
      setStatus("detecting");
      const response = await detectWalls({
        imageFile: originalFile,
        imageDimensions: dimensions,
        provider,
        signal: controller.signal,
        maskSmoothness,
        polygonTolerance,
        debug: process.env.NODE_ENV !== "production",
      });

      replaceMasks(response.walls.map(detectionResultToMask));
      setMetrics(response.metrics ?? null);
      setDebugRegions(response.debug?.regions ?? []);
      setActiveProvider(response.provider);
      setWallScores(response.walls.map(({ id, name, confidence, qualityScore }) => ({ id, name, confidence, qualityScore })));
      toast.success(`Paredes detectadas correctamente. Proveedor: ${response.provider}.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") { toast.info("Detección cancelada."); return; }
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron detectar paredes.",
      );
    } finally {
      controllerRef.current = null;
      setStatus("ready");
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">
          Proveedor de segmentación
        </span>
        <select
          value={provider}
          onChange={(event) =>
            setProvider(event.target.value as WallDetectionMode)
          }
          className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm text-[#202124] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
        >
          {providers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>

      {provider !== "mock" ? (
        <p className="rounded-md border border-[#f1d2a8] bg-[#fff7ed] px-3 py-2 text-xs leading-5 text-[#8a5a1f]">
          Esta imagen será procesada temporalmente por el backend seleccionado. Los conectores sin endpoint configurado informarán su estado sin alterar el editor.
        </p>
      ) : null}

      <label className="block text-xs text-[#5f6670]">
        Suavizado de máscara: {Math.round(maskSmoothness * 100)}%
        <input aria-label="Suavizado de máscara" type="range" min="0" max="1" step="0.05" value={maskSmoothness} onChange={(event) => setMaskSmoothness(Number(event.target.value))} disabled={isDetecting} className="mt-1 w-full accent-[#2563eb]" />
      </label>
      <label className="block text-xs text-[#5f6670]">
        Tolerancia de polígono: {polygonTolerance.toFixed(1)} px
        <input aria-label="Tolerancia de polígono" type="range" min="0.25" max="8" step="0.25" value={polygonTolerance} onChange={(event) => setPolygonTolerance(Number(event.target.value))} disabled={isDetecting} className="mt-1 w-full accent-[#2563eb]" />
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

      {isDetecting ? <button type="button" onClick={() => controllerRef.current?.abort()} className="h-9 w-full rounded-md border border-[#d5dae1] text-sm font-semibold text-[#49515c] hover:bg-[#f6f7f8]">Cancelar detección</button> : null}

      {metrics ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-[#f6f7f8] p-3 text-xs text-[#5f6670]">
          <div><dt>Proveedor actual</dt><dd className="font-semibold text-[#202124]">{activeProvider}</dd></div>
          <div><dt>Versión</dt><dd className="font-semibold text-[#202124]">{metrics.providerVersion}</dd></div>
          <div><dt>Tiempo</dt><dd className="font-semibold text-[#202124]">{metrics.processingTimeMs} ms{metrics.cacheHit ? " · caché" : ""}</dd></div>
          <div><dt>Paredes</dt><dd className="font-semibold text-[#202124]">{metrics.wallCount}</dd></div>
          <div><dt>Calidad media</dt><dd className="font-semibold text-[#202124]">{Math.round(metrics.averageQualityScore * 100)}%</dd></div>
        </dl>
      ) : null}

      {wallScores.length ? <ul className="space-y-1 text-xs text-[#5f6670]">{wallScores.map((wall) => <li key={wall.id} className="flex items-center justify-between gap-2"><span className="truncate">{wall.name}</span><span className="shrink-0 font-medium text-[#343b36]">Conf. {Math.round((wall.confidence ?? 0) * 100)}% · Calidad {Math.round((wall.qualityScore ?? 0) * 100)}%</span></li>)}</ul> : null}

      {process.env.NODE_ENV !== "production" && debugRegions.length ? (
        <details className="rounded-md border border-dashed border-[#cbd2da] p-2 text-xs text-[#5f6670]">
          <summary className="cursor-pointer font-semibold text-[#343b36]">Debug del pipeline ({debugRegions.length})</summary>
          {debugRegions.map((region) => <div key={region.id} className="mt-3"><p className="mb-1">{region.id} · confianza {Math.round(region.confidence * 100)}% · calidad {Math.round(region.qualityScore * 100)}%</p><div className="grid grid-cols-2 gap-2">{(["binary", "contour", "polygon", "refined"] as const).map((stage) => <figure key={stage}><DebugPreview region={region} stage={stage} /><figcaption className="mt-0.5 text-center capitalize">{stage}</figcaption></figure>)}</div></div>)}
        </details>
      ) : null}
    </div>
  );
}
