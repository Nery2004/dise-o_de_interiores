import {
  WallAIProviderConfigurationError,
  type ServerWallAIProvider,
} from "@/lib/server/wall-ai-providers/types";
import { getServerEnv } from "@/lib/env/serverEnv";

export const huggingFaceServerWallAIProvider: ServerWallAIProvider = {
  name: "huggingface",
  version: "not-configured",
  async segmentWalls() {
    if (!getServerEnv().huggingFaceApiToken) {
      throw new WallAIProviderConfigurationError(
        "Hugging Face no está configurado.",
      );
    }

    // TODO: Add the Hugging Face endpoint or model id.
    // TODO: Send the image buffer only to the selected private endpoint.
    // TODO: Transform the inference response into WallDetectionResult[].
    // TODO: Normalize masks into image-coordinate polygons.
    throw new WallAIProviderConfigurationError(
      "Hugging Face no tiene un endpoint de detección configurado todavía.",
    );
  },
};
