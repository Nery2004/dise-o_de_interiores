import { aiWallDetectionProvider } from "@/lib/wallDetection/aiProvider";
import { mockWallDetectionProvider } from "@/lib/wallDetection/mockProvider";
import type {
  WallDetectionMode,
  WallDetectionResponse,
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
}: DetectWallsOptions): Promise<WallDetectionResponse> {
  const wallDetectionProvider =
    provider === "ai" ? aiWallDetectionProvider : mockWallDetectionProvider;

  return wallDetectionProvider.detectWalls(imageFile, imageDimensions);
}

export type {
  WallDetectionMode,
  WallDetectionPoint,
  WallDetectionProvider,
  WallDetectionResponse,
  WallDetectionResult,
} from "@/lib/wallDetection/types";
