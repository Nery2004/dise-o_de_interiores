import {
  WallAIProviderConfigurationError,
  type ServerWallAIProvider,
} from "@/lib/server/wall-ai-providers/types";

export const huggingFaceServerWallAIProvider: ServerWallAIProvider = {
  name: "huggingface",
  async detectWalls() {
    if (!process.env.HUGGINGFACE_API_TOKEN) {
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
