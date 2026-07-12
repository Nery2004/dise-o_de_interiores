import type { WallAIProviderName } from "@/lib/wallDetection/types";

const providers = new Set<WallAIProviderName>(["mock", "replicate", "huggingface", "roboflow", "sam2", "florence-2", "grounding-dino", "yolo-segmentation", "custom"]);

export function parseWallAIProvider(value: string | undefined): WallAIProviderName {
  const provider = value?.trim() || "mock";
  if (!providers.has(provider as WallAIProviderName)) throw new Error(`WALL_AI_PROVIDER no es válido: ${provider}`);
  return provider as WallAIProviderName;
}

export function parseProviderTimeout(value: string | undefined) {
  const timeout = Number(value);
  return Number.isFinite(timeout) && timeout >= 1_000 && timeout <= 60_000 ? timeout : 15_000;
}
