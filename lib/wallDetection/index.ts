import { aiWallDetectionProvider, refineDetectedWall } from "@/lib/wallDetection/aiProvider";
import type {
  WallDetectionMode,
  WallDetectionResponse,
} from "@/lib/wallDetection/types";

type DetectWallsOptions = {
  imageFile: File;
  imageDimensions: { width: number; height: number };
  provider: WallDetectionMode;
  signal?: AbortSignal;
  maskSmoothness?: number;
  polygonTolerance?: number;
  debug?: boolean;
};

export async function detectWalls({
  imageDimensions,
  imageFile,
  provider,
  signal,
  maskSmoothness,
  polygonTolerance,
  debug,
}: DetectWallsOptions): Promise<WallDetectionResponse> {
  return aiWallDetectionProvider.detectWalls(imageFile, imageDimensions, { provider, signal, maskSmoothness, polygonTolerance, debug });
}

export async function refineWall({
  imageFile,
  wall,
  signal,
  polygonTolerance,
  debug,
}: {
  imageFile: File;
  wall: import("@/lib/wallDetection/types").WallDetectionResult;
  signal?: AbortSignal;
  polygonTolerance?: number;
  debug?: boolean;
}) {
  return refineDetectedWall(imageFile, wall, { signal, polygonTolerance, debug });
}

export type {
  WallDetectionMode,
  WallDetectionPoint,
  WallDetectionProvider,
  WallDetectionResponse,
  WallDetectionResult,
} from "@/lib/wallDetection/types";
