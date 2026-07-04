import {
  WallAIProviderConfigurationError,
  type ServerWallAIProvider,
} from "@/lib/server/wall-ai-providers/types";

export const replicateServerWallAIProvider: ServerWallAIProvider = {
  name: "replicate",
  async detectWalls() {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new WallAIProviderConfigurationError(
        "Replicate no está configurado.",
      );
    }

    // TODO: Add the Replicate model id.
    // TODO: Upload or pass the image securely according to the chosen model.
    // TODO: Transform the model response into WallDetectionResult[].
    // TODO: Normalize masks into image-coordinate polygons.
    throw new WallAIProviderConfigurationError(
      "Replicate no tiene un modelo de detección configurado todavía.",
    );
  },
};
