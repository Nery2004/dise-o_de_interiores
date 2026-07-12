import { getConfiguredWallAIProvider } from "@/lib/server/aiConfig";
import { huggingFaceServerWallAIProvider } from "@/lib/server/wall-ai-providers/huggingfaceProvider";
import { mockServerWallAIProvider } from "@/lib/server/wall-ai-providers/mockProvider";
import { replicateServerWallAIProvider } from "@/lib/server/wall-ai-providers/replicateProvider";
import { roboflowServerWallAIProvider } from "@/lib/server/wall-ai-providers/roboflowProvider";
import type { ServerWallAIProvider } from "@/lib/server/wall-ai-providers/types";
import type { WallDetectionMode } from "@/lib/wallDetection/types";
import { WallAIProviderConfigurationError } from "@/lib/server/wall-ai-providers/types";

function unconfiguredProvider(name: "sam2" | "florence-2" | "grounding-dino" | "yolo-segmentation" | "custom"): ServerWallAIProvider {
  return {
    name,
    version: "not-configured",
    async segmentWalls() {
      throw new WallAIProviderConfigurationError(`${name} está disponible en la arquitectura, pero todavía no tiene un endpoint configurado.`);
    },
  };
}

export function getWallAIProvider(requested: WallDetectionMode = "ai"): ServerWallAIProvider {
  const provider = requested === "ai" ? getConfiguredWallAIProvider() : requested;

  if (provider === "replicate") {
    return replicateServerWallAIProvider;
  }

  if (provider === "huggingface") {
    return huggingFaceServerWallAIProvider;
  }

  if (provider === "roboflow") {
    return roboflowServerWallAIProvider;
  }

  if (["sam2", "florence-2", "grounding-dino", "yolo-segmentation", "custom"].includes(provider)) {
    return unconfiguredProvider(provider as "sam2" | "florence-2" | "grounding-dino" | "yolo-segmentation" | "custom");
  }

  return mockServerWallAIProvider;
}

export { WallAIProviderConfigurationError } from "@/lib/server/wall-ai-providers/types";
export type {
  ServerWallAIProvider,
  ServerWallAIProviderInput,
} from "@/lib/server/wall-ai-providers/types";
