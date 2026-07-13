import type { WallDetectionResult } from "@/lib/wallDetection/types";
import { WorkerPool } from "@/lib/workers/WorkerPool";

type Request = { walls: WallDetectionResult[]; tolerance: number };
type Response = { id: number; walls?: WallDetectionResult[] };
let pool: WorkerPool<Request, Response> | null = null;

function getPool() {
  if (pool) return pool;
  const cores = typeof navigator === "undefined" ? 2 : navigator.hardwareConcurrency || 2;
  pool = new WorkerPool(
    () => new Worker(new URL("../../workers/wall-refinement.worker.ts", import.meta.url), { type: "module" }),
    Math.max(1, Math.min(2, cores - 1)),
  );
  return pool;
}

export function getRefinementWorkerPoolStatus() {
  return pool?.stats() ?? { workers: 0, active: 0, queued: 0, maximumSize: 2 };
}

export function disposeRefinementWorkerPool() {
  pool?.dispose();
  pool = null;
}

export async function optimizeDetectedWallsInWorker(walls: WallDetectionResult[], tolerance: number, signal?: AbortSignal) {
  if (typeof Worker === "undefined") return Promise.resolve(walls);
  try {
    const response = await getPool().run({ walls, tolerance }, [], signal);
    return Array.isArray(response.walls) ? response.walls : walls;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return walls;
  }
}
