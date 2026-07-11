import "server-only";
import { parseProviderTimeout, parseWallAIProvider } from "@/lib/env/envValidation";

export function getServerEnv() {
  return {
    wallAIProvider: parseWallAIProvider(process.env.WALL_AI_PROVIDER),
    wallAITimeoutMs: parseProviderTimeout(process.env.WALL_AI_TIMEOUT_MS),
    replicateApiToken: process.env.REPLICATE_API_TOKEN?.trim() || null,
    huggingFaceApiToken: process.env.HUGGINGFACE_API_TOKEN?.trim() || null,
    roboflowApiKey: process.env.ROBOFLOW_API_KEY?.trim() || null,
  } as const;
}
