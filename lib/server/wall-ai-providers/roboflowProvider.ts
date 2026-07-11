import {
  WallAIProviderConfigurationError,
  type ServerWallAIProvider,
} from "@/lib/server/wall-ai-providers/types";
import { getServerEnv } from "@/lib/env/serverEnv";

export const roboflowServerWallAIProvider: ServerWallAIProvider = {
  name: "roboflow",
  async detectWalls() {
    if (!getServerEnv().roboflowApiKey) {
      throw new WallAIProviderConfigurationError(
        "Roboflow no está configurado.",
      );
    }

    // TODO: Add the Roboflow project/version endpoint.
    // TODO: Send the image buffer only after the target model is chosen.
    // TODO: Transform Roboflow predictions into WallDetectionResult[].
    // TODO: Normalize masks into image-coordinate polygons.
    throw new WallAIProviderConfigurationError(
      "Roboflow no tiene un endpoint de detección configurado todavía.",
    );
  },
};
