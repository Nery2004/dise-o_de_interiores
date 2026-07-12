import type { ObjectColorAdjustments } from "@/lib/lighting/pixelAdjustment";

let worker: Worker | null = null;
let sequence = 0;
const pending = new Map<number, { resolve: (data: ImageData | null) => void; width: number; height: number }>();

export function getLightingWorkerStatus() {
  return { active: worker !== null, pendingRequests: pending.size };
}

export function disposeLightingWorker() {
  for (const request of pending.values()) request.resolve(null);
  pending.clear();
  worker?.terminate();
  worker = null;
}

function getWorker() {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return null;
  if (worker) return worker;
  worker = new Worker(new URL("../../workers/decor-lighting.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<{ id: number; data: ArrayBuffer }>) => {
    const request = pending.get(event.data.id);
    if (!request) return;
    pending.delete(event.data.id);
    request.resolve(new ImageData(new Uint8ClampedArray(event.data.data), request.width, request.height));
  };
  worker.onerror = () => {
    disposeLightingWorker();
  };
  return worker;
}

export async function applyObjectColorAdjustmentsOffThread(imageData: ImageData, settings: ObjectColorAdjustments) {
  const target = getWorker();
  if (!target) return null;
  const id = ++sequence;
  const data = imageData.data.slice().buffer;
  return new Promise<ImageData | null>((resolve) => {
    pending.set(id, {
      width: imageData.width,
      height: imageData.height,
      resolve,
    });
    target.postMessage({ id, width: imageData.width, height: imageData.height, data, settings });
  });
}
