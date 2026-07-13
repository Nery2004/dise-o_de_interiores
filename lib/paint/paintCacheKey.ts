import { PAINT_PIPELINE_VERSION } from "@/lib/paint/pipelineVersion";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]));
  return value;
}

export function createPaintPreColorCacheKey(input: {
  imageHash: string;
  maskVersion: string;
  quality: string;
  neutralizationSettings: unknown;
  feather: number;
}) {
  return JSON.stringify(stable({ ...input, pipelineVersion: PAINT_PIPELINE_VERSION }));
}
