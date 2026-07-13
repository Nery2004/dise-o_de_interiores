import { WALL_DETECTION_PIPELINE_VERSION } from "@/lib/wallDetection/pipeline/version";

type CacheKeyInput = {
  imageHash: string;
  provider: string;
  providerVersion: string;
  configuration: unknown;
  refinementTarget?: unknown;
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  return value;
}

export type WallDetectionCacheKey = string;

export function createWallDetectionCacheKey({
  imageHash,
  provider,
  providerVersion,
  configuration,
  refinementTarget = null,
}: CacheKeyInput): WallDetectionCacheKey {
  return JSON.stringify(stableValue({
    imageHash,
    pipelineVersion: WALL_DETECTION_PIPELINE_VERSION,
    provider,
    providerVersion,
    configuration,
    refinementTarget,
  }));
}
