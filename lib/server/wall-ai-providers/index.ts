import { getConfiguredWallAIProvider } from "@/lib/server/aiConfig";
import { huggingFaceServerWallAIProvider } from "@/lib/server/wall-ai-providers/huggingfaceProvider";
import { mockServerWallAIProvider } from "@/lib/server/wall-ai-providers/mockProvider";
import { replicateServerWallAIProvider } from "@/lib/server/wall-ai-providers/replicateProvider";
import { roboflowServerWallAIProvider } from "@/lib/server/wall-ai-providers/roboflowProvider";
import type { ServerWallAIProvider } from "@/lib/server/wall-ai-providers/types";

export function getWallAIProvider(): ServerWallAIProvider {
  const provider = getConfiguredWallAIProvider();

  if (provider === "replicate") {
    return replicateServerWallAIProvider;
  }

  if (provider === "huggingface") {
    return huggingFaceServerWallAIProvider;
  }

  if (provider === "roboflow") {
    return roboflowServerWallAIProvider;
  }

  return mockServerWallAIProvider;
}

export { WallAIProviderConfigurationError } from "@/lib/server/wall-ai-providers/types";
export type {
  ServerWallAIProvider,
  ServerWallAIProviderInput,
} from "@/lib/server/wall-ai-providers/types";
