import { PaintRenderPipeline, type PaintRenderInput, type PaintRenderResult } from "@/lib/paint/PaintRenderPipeline";
import { WorkerPool } from "@/lib/workers/WorkerPool";

type WorkerInput = Omit<PaintRenderInput, "signal" | "diagnostics">;
type WorkerResponse = {
  id: number;
  data?: ArrayBuffer;
  error?: string;
  width: number;
  height: number;
  timings: PaintRenderResult["timings"];
};

let pool: WorkerPool<{ input: WorkerInput }, WorkerResponse> | null = null;

function getPool() {
  if (pool) return pool;
  const cores = typeof navigator === "undefined" ? 2 : navigator.hardwareConcurrency || 2;
  const memory = typeof navigator === "undefined" ? 4 : (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const size = memory <= 2 ? 1 : Math.max(1, Math.min(2, cores - 1));
  pool = new WorkerPool(
    () => new Worker(new URL("../../workers/paint-render.worker.ts", import.meta.url), { type: "module" }),
    size,
  );
  return pool;
}

export function getPaintWorkerStatus() {
  return pool?.stats() ?? { workers: 0, active: 0, queued: 0, maximumSize: 2 };
}

export function disposePaintWorkerPool() {
  pool?.dispose();
  pool = null;
}

export async function renderPaint(input: PaintRenderInput): Promise<PaintRenderResult> {
  const pixels = input.originalImage.width * input.originalImage.height;
  if (typeof Worker === "undefined" || pixels < 120_000 || input.diagnostics) {
    return new PaintRenderPipeline().render(input);
  }
  const { signal: _signal, diagnostics: _diagnostics, ...workerInputSource } = input;
  void _signal;
  void _diagnostics;
  // Worker transfers must never detach arrays retained by the raster/mask caches.
  const workerInput: WorkerInput = {
    ...workerInputSource,
    originalImage: {
      ...workerInputSource.originalImage,
      data: workerInputSource.originalImage.data.slice(),
    },
    mask: {
      ...workerInputSource.mask,
      alpha: workerInputSource.mask.alpha.slice(),
    },
  };
  const transfer = [
    workerInput.originalImage.data.buffer as ArrayBuffer,
    workerInput.mask.alpha.buffer as ArrayBuffer,
  ];
  const response = await getPool().run({ input: workerInput }, transfer, input.signal, 10);
  if (response.error || !response.data) throw new Error(response.error ?? "Paint worker returned no data");
  return {
    imageData: new Uint8ClampedArray(response.data),
    width: response.width,
    height: response.height,
    timings: response.timings,
  };
}
