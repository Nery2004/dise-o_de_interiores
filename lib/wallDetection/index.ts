import { aiWallDetectionProvider } from "@/lib/wallDetection/aiProvider";
import { mockWallDetectionProvider } from "@/lib/wallDetection/mockProvider";
import type {
  WallDetectionMode,
  WallDetectionResult,
} from "@/lib/wallDetection/types";

type DetectWallsOptions = {
  imageFile: File;
  imageDimensions: { width: number; height: number };
  provider: WallDetectionMode;
};

export async function detectWalls({
  imageDimensions,
  imageFile,
  provider,
}: DetectWallsOptions): Promise<WallDetectionResult[]> {
  const wallDetectionProvider =
    provider === "ai" ? aiWallDetectionProvider : mockWallDetectionProvider;

  return wallDetectionProvider.detectWalls(imageFile, imageDimensions);
}

export type {
  WallDetectionMode,
  WallDetectionPoint,
  WallDetectionProvider,
  WallDetectionResult,
} from "@/lib/wallDetection/types";
