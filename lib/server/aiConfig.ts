import { getServerEnv } from "@/lib/env/serverEnv";
import type { WallAIProviderName } from "@/lib/wallDetection/types";
import { WallAIProviderConfigurationError } from "@/lib/server/wall-ai-providers/types";

export function getConfiguredWallAIProvider(): WallAIProviderName {
  try { return getServerEnv().wallAIProvider as WallAIProviderName; }
  catch { throw new WallAIProviderConfigurationError("La configuración del proveedor de IA no es válida."); }
}
