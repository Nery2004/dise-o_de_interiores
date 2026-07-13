"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useComparison } from "@/components/comparison-context";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useEditor } from "@/components/editor-context";
import { getDecorObjectRenderCacheStats } from "@/lib/lighting/DecorObjectRenderPipeline";
import { getLightingWorkerStatus } from "@/lib/lighting/lightingWorkerClient";
import { getPaintLayerCacheStats } from "@/lib/paint/CanvasRenderer";
import { getPaintRasterCacheStats } from "@/lib/paint/imageRaster";
import { getPaintWorkerStatus } from "@/lib/paint/paintWorkerClient";
import { getWallAnalysisCacheStats } from "@/lib/paint/wallBaseAnalysisService";
import { resolveEditorInteractionState } from "@/lib/editor/interactionState";
import {
  getPerformanceSnapshot,
  subscribePerformance,
} from "@/lib/performance/performanceMonitor";
import { renderProfiler } from "@/lib/performance/RenderProfiler";
import { getRefinementWorkerPoolStatus } from "@/lib/wallDetection/refinementWorkerClient";

export function DevEditorDiagnostics() {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const comparison = useComparison();
  const performance = useSyncExternalStore(
    subscribePerformance,
    getPerformanceSnapshot,
    getPerformanceSnapshot,
  );
  const [, refresh] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => refresh((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const cache = getDecorObjectRenderCacheStats();
  const worker = getLightingWorkerStatus();
  const paintLayerCache = getPaintLayerCacheStats();
  const paintRasterCache = getPaintRasterCacheStats().rasters;
  const analysisCache = getWallAnalysisCacheStats();
  const paintWorker = getPaintWorkerStatus();
  const refinementWorker = getRefinementWorkerPoolStatus();
  const cacheBytes = cache.estimatedBytes + paintLayerCache.estimatedBytes + paintRasterCache.estimatedBytes + analysisCache.estimatedBytes;
  const renderCounts = renderProfiler.snapshot();
  const interaction = resolveEditorInteractionState({
    activeTool: editor.activeTool,
    comparisonMode: comparison.mode,
    isDrawingMask: editor.isDrawingMask,
    objectInteractionMode: placement.objectInteractionMode,
  });
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    sessionStorage.setItem(
      "interior-color-studio:dev-diagnostics",
      JSON.stringify({
        cacheBytes,
        interaction,
        lastExportMs: performance.lastExportMs,
        lastRenderMs: performance.lastRenderMs,
        masks: editor.masks.length,
        objects: placement.placedObjects.length,
        scale: editor.zoom,
        workerActive: worker.active,
        paintWorker,
        refinementWorker,
        renderCounts,
      }),
    );
  }, [cacheBytes, editor.masks.length, editor.zoom, interaction, paintWorker, performance.lastExportMs, performance.lastRenderMs, placement.placedObjects.length, refinementWorker, renderCounts, worker.active]);
  if (process.env.NODE_ENV !== "development") return null;
  const duration = (value: number | null) =>
    value === null ? "—" : `${value.toFixed(1)} ms`;

  return (
    <details className="fixed bottom-12 left-3 z-[90] max-w-[320px] rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-100 shadow-xl">
      <summary className="cursor-pointer font-semibold">Diagnóstico del editor</summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt>Estado</dt><dd>{interaction}</dd>
        <dt>Zoom</dt><dd>{Math.round(editor.zoom * 100)}%</dd>
        <dt>Máscaras</dt><dd>{editor.masks.length}</dd>
        <dt>Objetos</dt><dd>{placement.placedObjects.length}</dd>
        <dt>Render</dt><dd>{duration(performance.lastRenderMs)} · p95 {duration(performance.metrics.render?.p95Ms ?? null)}</dd>
        <dt>Exportación</dt><dd>{duration(performance.lastExportMs)}</dd>
        <dt>Cachés</dt><dd>{(cacheBytes / 1048576).toFixed(1)} MB estimados</dd>
        <dt>Paint pool</dt><dd>{paintWorker.active} activos · {paintWorker.queued} cola</dd>
        <dt>Refine pool</dt><dd>{refinementWorker.active} activos · {refinementWorker.queued} cola</dd>
        <dt>Lighting</dt><dd>{worker.active ? `activo (${worker.pendingRequests})` : "inactivo"}</dd>
        <dt>Renders</dt><dd>{Object.entries(renderCounts).map(([name, count]) => `${name} ${count}`).join(" · ") || "—"}</dd>
      </dl>
    </details>
  );
}
