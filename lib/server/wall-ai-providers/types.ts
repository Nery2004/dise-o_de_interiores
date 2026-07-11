import type {
  WallAIProviderName,
  WallDetectionResult,
} from "@/lib/wallDetection/types";

export type ServerWallAIProviderInput = {
  imageBuffer: Buffer;
  mimeType: string;
  dimensions: { width: number; height: number };
  signal: AbortSignal;
};

export type ServerWallAIProvider = {
  name: WallAIProviderName;
  detectWalls(input: ServerWallAIProviderInput): Promise<WallDetectionResult[]>;
};

export class WallAIProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WallAIProviderConfigurationError";
  }
}
