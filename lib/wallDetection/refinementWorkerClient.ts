import type { WallDetectionResult } from "@/lib/wallDetection/types";

export function optimizeDetectedWallsInWorker(walls: WallDetectionResult[], tolerance: number, signal?: AbortSignal) {
  if (typeof Worker === "undefined") return Promise.resolve(walls);
  return new Promise<WallDetectionResult[]>((resolve, reject) => {
    const worker = new Worker(new URL("../../workers/wall-refinement.worker.ts", import.meta.url), { type: "module" });
    const cleanup = () => worker.terminate();
    const abort = () => { cleanup(); reject(new DOMException("Refinamiento cancelado", "AbortError")); };
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ walls?: WallDetectionResult[] }>) => {
      signal?.removeEventListener("abort", abort);
      cleanup();
      resolve(Array.isArray(event.data.walls) ? event.data.walls : walls);
    };
    worker.onerror = () => {
      signal?.removeEventListener("abort", abort);
      cleanup();
      resolve(walls);
    };
    worker.postMessage({ walls, tolerance });
  });
}
