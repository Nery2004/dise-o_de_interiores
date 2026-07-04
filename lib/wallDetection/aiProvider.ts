import type { WallDetectionProvider } from "@/lib/wallDetection/types";

export const aiWallDetectionProvider: WallDetectionProvider = {
  async detectWalls() {
    // Future integration points:
    // - Call a custom wall-segmentation model.
    // - Send the image to an external computer-vision API.
    // - Route detection through a serverless endpoint to protect secrets.
    // - Replace polygon approximation with advanced segmentation masks.
    throw new Error("AI wall detection provider is not configured yet.");
  },
};
