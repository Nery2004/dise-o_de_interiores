import type { ImageDimensions, RenderQuality } from "@/types/editor";

export type PreviewPerformanceMode = "automatic" | "performance" | "quality";

export type PreviewResolutionInput = {
  image: ImageDimensions;
  viewport?: ImageDimensions;
  devicePixelRatio?: number;
  deviceMemoryGb?: number;
  mobile?: boolean;
  quality: RenderQuality;
  mode?: PreviewPerformanceMode;
};

const MAX_PIXELS: Record<PreviewPerformanceMode, Record<RenderQuality, number>> = {
  performance: { draft: 600_000, high: 1_200_000, ultra: 4_000_000 },
  automatic: { draft: 900_000, high: 2_200_000, ultra: 8_000_000 },
  quality: { draft: 1_400_000, high: 4_000_000, ultra: 16_000_000 },
};

export function getOptimalPreviewResolution({
  image,
  viewport,
  devicePixelRatio = 1,
  deviceMemoryGb = 4,
  mobile = false,
  quality,
  mode = "automatic",
}: PreviewResolutionInput) {
  const dprLimit = mode === "performance" || mobile || deviceMemoryGb <= 2 ? 1.25 : 2;
  const dpr = Math.min(Math.max(1, devicePixelRatio), dprLimit);
  const viewportPixels = viewport ? Math.max(1, viewport.width * viewport.height * dpr * dpr) : Number.POSITIVE_INFINITY;
  const memoryFactor = deviceMemoryGb <= 2 ? 0.55 : deviceMemoryGb <= 4 ? 0.8 : 1;
  const mobileFactor = mobile ? 0.72 : 1;
  const pixelBudget = Math.max(320_000, Math.min(MAX_PIXELS[mode][quality] * memoryFactor * mobileFactor, viewportPixels * 1.2));
  const imagePixels = Math.max(1, image.width * image.height);
  const scale = Math.min(1, Math.sqrt(pixelBudget / imagePixels));
  return {
    width: Math.max(1, Math.round(image.width * scale)),
    height: Math.max(1, Math.round(image.height * scale)),
    scale,
    dpr,
    estimatedRgbaBytes: Math.round(imagePixels * scale * scale * 4),
    pixelBudget: Math.round(pixelBudget),
  };
}
