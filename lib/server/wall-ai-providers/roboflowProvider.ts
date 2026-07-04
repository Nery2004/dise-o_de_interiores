import {
  WallAIProviderConfigurationError,
  type ServerWallAIProvider,
} from "@/lib/server/wall-ai-providers/types";

export const roboflowServerWallAIProvider: ServerWallAIProvider = {
  name: "roboflow",
  async detectWalls() {
    if (!process.env.ROBOFLOW_API_KEY) {
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
