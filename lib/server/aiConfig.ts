import type { WallAIProviderName } from "@/lib/wallDetection/types";

const wallAIProviders = new Set<WallAIProviderName>([
  "mock",
  "replicate",
  "huggingface",
  "roboflow",
]);

export function getConfiguredWallAIProvider(): WallAIProviderName {
  const provider = process.env.WALL_AI_PROVIDER;

  if (!provider) {
    return "mock";
  }

  if (wallAIProviders.has(provider as WallAIProviderName)) {
    return provider as WallAIProviderName;
  }

  console.warn(
    `Invalid WALL_AI_PROVIDER "${provider}". Falling back to mock provider.`,
  );
  return "mock";
}
