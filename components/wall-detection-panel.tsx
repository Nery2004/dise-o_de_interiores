"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { detectWalls, refineWall, type WallDetectionMode } from "@/lib/wallDetection";
import type { WallDetectionDebugRegion, WallDetectionMetrics, WallDetectionResult } from "@/lib/wallDetection/types";
import type { BrushStroke, ImageDimensions, WallMask } from "@/types/editor";
import { optimizeDetectedWallsInWorker } from "@/lib/wallDetection/refinementWorkerClient";

function exclusionStrokes(polygons: WallDetectionResult["exclusionPolygons"]): BrushStroke[] {
  const createdAt = new Date().toISOString();
  return (polygons ?? []).flatMap((polygon, polygonIndex) => {
    const minimumY = Math.min(...polygon.map((point) => point.y));
    const maximumY = Math.max(...polygon.map((point) => point.y));
    const size = Math.max(2, Math.min(12, (maximumY - minimumY) / 48));
    const strokes: BrushStroke[] = [];
    for (let y = minimumY + size / 2, row = 0; y <= maximumY - size / 2; y += Math.max(1, size * 0.7), row += 1) {
      const intersections: number[] = [];
      for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
        const start = polygon[previous]; const end = polygon[index];
        if ((start.y > y) === (end.y > y)) continue;
        intersections.push(start.x + (y - start.y) * (end.x - start.x) / (end.y - start.y));
      }
      intersections.sort((first, second) => first - second);
      for (let pair = 0; pair + 1 < intersections.length; pair += 2) {
        const start = intersections[pair]; const end = intersections[pair + 1];
        const inset = Math.min(size / 2, Math.max(0, (end - start) / 2));
        strokes.push({ id: `auto-exclusion-${polygonIndex}-${row}-${pair}`, mode: "remove", size, hardness: 0.999, opacity: 1, points: [{ x: start + inset, y }, { x: end - inset, y }], createdAt });
      }
    }
    return strokes;
  });
}

function detectionResultToMask(result: WallDetectionResult, dimensions: ImageDimensions): WallMask {
  const removeStrokes = exclusionStrokes(result.exclusionPolygons);
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
    refinement: removeStrokes.length ? { width: dimensions.width, height: dimensions.height, addStrokes: [], removeStrokes } : undefined,
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

type DebugStage = "original" | "cleaned" | "corrected" | "final";

function DebugPreview({ region, stage }: { region: WallDetectionDebugRegion; stage: DebugStage }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.width = region.width; canvas.height = region.height;
    const image = context.createImageData(region.width, region.height);
    const mask = decodeRle(region.stageMasksRle?.[stage] ?? region.binaryMaskRle, region.width * region.height);
    for (let index = 0; index < mask.length; index += 1) { const tone = mask[index] ? 38 : 245; image.data.set([tone, mask[index] ? 99 : 245, mask[index] ? 235 : 245, 255], index * 4); }
    context.putImageData(image, 0, 0);
    const points = stage === "final" ? region.refined : [];
    if (points.length) {
      context.strokeStyle = "#16a34a"; context.lineWidth = Math.max(1, region.width / 180); context.beginPath();
      points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y)); context.closePath(); context.stroke();
    }
  }, [region, stage]);
  return <canvas ref={ref} className="h-20 w-full rounded border border-[#dfe3e8] object-contain [image-rendering:pixelated]" />;
}

export function WallDetectionPanel() {
  const {
    dimensions,
    masks,
    originalFile,
    replaceMasks,
    selectedMaskId,
    setStatus,
    status,
    updateMask,
  } = useEditor();
  const [provider, setProvider] = useState<WallDetectionMode>("mock");
  const [maskSmoothness, setMaskSmoothness] = useState(0.45);
  const [polygonTolerance, setPolygonTolerance] = useState(1.8);
  const [metrics, setMetrics] = useState<WallDetectionMetrics | null>(null);
  const [debugRegions, setDebugRegions] = useState<WallDetectionDebugRegion[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [wallScores, setWallScores] = useState<WallDetectionResult[]>([]);
  const [isRefining, setIsRefining] = useState(false);
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

      const optimizedWalls = await optimizeDetectedWallsInWorker(response.walls, polygonTolerance, controller.signal);
      replaceMasks(optimizedWalls.map((wall) => detectionResultToMask(wall, dimensions)));
      setMetrics(response.metrics ?? null);
      setDebugRegions(response.debug?.regions ?? []);
      setActiveProvider(response.provider);
      setWallScores(optimizedWalls);
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

  async function handleRefineSelected() {
    const selected = masks.find((mask) => mask.id === selectedMaskId);
    if (!originalFile || !dimensions || !selected?.points) {
      toast.error("Selecciona una pared editable antes de refinarla.");
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsRefining(true);
    try {
      const response = await refineWall({
        imageFile: originalFile,
        wall: { id: selected.id, name: selected.name, points: selected.points, confidence: selected.confidence },
        signal: controller.signal,
        polygonTolerance,
        debug: process.env.NODE_ENV !== "production",
      });
      const [refined] = await optimizeDetectedWallsInWorker(response.walls, polygonTolerance, controller.signal);
      if (!refined) throw new Error("No se pudo refinar la pared seleccionada.");
      updateMask(selected.id, { points: refined.points, qualityScore: refined.qualityScore });
      setWallScores((current) => current.some((wall) => wall.id === refined.id)
        ? current.map((wall) => wall.id === refined.id ? refined : wall)
        : [...current, refined]);
      setMetrics(response.metrics ?? null);
      setDebugRegions(response.debug?.regions ?? []);
      setActiveProvider(response.provider);
      toast.success("La pared seleccionada fue refinada.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") toast.info("Refinamiento cancelado.");
      else toast.error(error instanceof Error ? error.message : "No se pudo refinar la pared.");
    } finally {
      controllerRef.current = null;
      setIsRefining(false);
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
          disabled={isDetecting || isRefining}
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
        <input aria-label="Suavizado de máscara" type="range" min="0" max="1" step="0.05" value={maskSmoothness} onChange={(event) => setMaskSmoothness(Number(event.target.value))} disabled={isDetecting || isRefining} className="mt-1 w-full accent-[#2563eb]" />
      </label>
      <label className="block text-xs text-[#5f6670]">
        Tolerancia de polígono: {polygonTolerance.toFixed(1)} px
        <input aria-label="Tolerancia de polígono" type="range" min="0.25" max="8" step="0.25" value={polygonTolerance} onChange={(event) => setPolygonTolerance(Number(event.target.value))} disabled={isDetecting || isRefining} className="mt-1 w-full accent-[#2563eb]" />
      </label>

      <button
        type="button"
        onClick={() => void handleDetectWalls()}
        disabled={isDetecting || isRefining}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2421] px-3 text-sm font-semibold text-white transition hover:bg-[#343b36] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <WandSparkles size={16} />
        {isDetecting ? "Detectando..." : "Detectar paredes"}
      </button>

      {isDetecting || isRefining ? <button type="button" onClick={() => controllerRef.current?.abort()} className="h-9 w-full rounded-md border border-[#d5dae1] text-sm font-semibold text-[#49515c] hover:bg-[#f6f7f8]">Cancelar procesamiento</button> : null}

      {metrics ? (
        <section className="space-y-2 rounded-md border border-[#dfe3e8] bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#59616d]">Refinamiento IA</h3>
            <span className="text-[11px] text-[#7a8290]">{metrics.refinementCount} etapas</span>
          </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-[#f6f7f8] p-3 text-xs text-[#5f6670]">
          <div><dt>Proveedor actual</dt><dd className="font-semibold text-[#202124]">{activeProvider}</dd></div>
          <div><dt>Versión</dt><dd className="font-semibold text-[#202124]">{metrics.providerVersion}</dd></div>
          <div><dt>Tiempo</dt><dd className="font-semibold text-[#202124]">{metrics.processingTimeMs} ms{metrics.cacheHit ? " · caché" : ""}</dd></div>
          <div><dt>Paredes</dt><dd className="font-semibold text-[#202124]">{metrics.wallCount}</dd></div>
          {process.env.NODE_ENV !== "production" ? <div><dt>Quality Score</dt><dd className="font-semibold text-[#202124]">{Math.round(metrics.averageQualityScore)}/100</dd></div> : null}
          <div><dt>Puntos</dt><dd className="font-semibold text-[#202124]">{wallScores.reduce((sum, wall) => sum + wall.points.length, 0)}</dd></div>
        </dl>
          <button type="button" onClick={() => void handleRefineSelected()} disabled={!selectedMaskId || isRefining || isDetecting} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#cfd5dc] bg-white text-xs font-semibold text-[#343b36] transition hover:bg-[#f6f7f8] disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={14} className={isRefining ? "animate-spin" : ""} />
            {isRefining ? "Refinando esta pared..." : "Refinar nuevamente"}
          </button>
        </section>
      ) : null}

      {wallScores.length ? <ul className="space-y-1 text-xs text-[#5f6670]">{wallScores.map((wall) => <li key={wall.id} className="flex items-center justify-between gap-2"><span className="truncate">{wall.name}</span><span className="shrink-0 font-medium text-[#343b36]">Conf. {Math.round((wall.confidence ?? 0) * 100)}%{process.env.NODE_ENV !== "production" ? ` · Calidad ${Math.round(wall.qualityScore ?? 0)}/100` : ""}</span></li>)}</ul> : null}

      {process.env.NODE_ENV !== "production" && debugRegions.length ? (
        <details className="rounded-md border border-dashed border-[#cbd2da] p-2 text-xs text-[#5f6670]">
          <summary className="cursor-pointer font-semibold text-[#343b36]">Debug del pipeline ({debugRegions.length})</summary>
          {debugRegions.map((region) => <div key={region.id} className="mt-3"><p className="mb-1">{region.id} · confianza {Math.round(region.confidence * 100)}% · calidad {Math.round(region.qualityScore)}/100 · {region.refined.length} puntos · reintentos {region.retryCount}</p><div className="grid grid-cols-2 gap-2">{(["original", "cleaned", "corrected", "final"] as const).map((stage) => <figure key={stage}><DebugPreview region={region} stage={stage} /><figcaption className="mt-0.5 text-center">{{ original: "Original", cleaned: "Después de limpieza", corrected: "Después de corrección", final: "Máscara final" }[stage]}</figcaption></figure>)}</div><p className="mt-2 leading-5">Etapas: {region.appliedStages.join(", ")}.</p><p className="leading-5">Tiempos: {Object.entries(region.stageTimings).map(([name, time]) => `${name} ${time} ms`).join(" · ") || "sin etapas"}.</p>{region.issues.length ? <p className="leading-5 text-[#9a5b22]">Alertas: {region.issues.map((item) => item.type).join(", ")}.</p> : null}</div>)}
        </details>
      ) : null}
    </div>
  );
}
