import { performance } from "@/lib/performance/performancePolyfill";
import { hexToRgbColor, rgbToOklab, type RgbColor } from "@/lib/colors/colorSpace";
import { processPaintPixel } from "@/lib/paint/PaintPipeline";
import { createLocalLuminanceField } from "@/lib/paint/TextureExtractionPass";
import type { EffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";
import type { BlendMode, PaintMode, RenderQuality } from "@/types/editor";
import { PAINT_PIPELINE_VERSION } from "@/lib/paint/pipelineVersion";

export type PaintRaster = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export type PaintMaskRaster = {
  alpha: Uint8ClampedArray;
  width: number;
  height: number;
};

export type PaintRenderInput = {
  originalImage: PaintRaster;
  mask: PaintMaskRaster;
  targetColor: string;
  paintMode: PaintMode;
  paintIntensity: number;
  primerCoverage: number;
  neutralizationSettings: EffectiveWhiteBaseSettings;
  shadowPreservation: number;
  texturePreservation: number;
  edgeFeather: number;
  blendMode: BlendMode;
  quality: RenderQuality;
  averageLuminance?: number;
  whiteBasePreviewOnly?: boolean;
  diagnostics?: boolean;
  signal?: AbortSignal;
};

export type PaintRenderDiagnostics = {
  pipelineVersion: string;
  luminance: Float32Array;
  localLuminance: Float32Array;
  texture: Float32Array;
  alpha: Uint8ClampedArray;
  clippedChannelCount: number;
};

export type PaintRenderResult = {
  imageData: Uint8ClampedArray;
  width: number;
  height: number;
  timings: {
    luminanceMs: number;
    colorMs: number;
    totalMs: number;
  };
  diagnostics?: PaintRenderDiagnostics;
};

const qualityRadius: Record<RenderQuality, number> = { draft: 1, high: 2, ultra: 3 };

function assertInput(input: PaintRenderInput) {
  const pixels = input.originalImage.width * input.originalImage.height;
  if (
    input.mask.width !== input.originalImage.width ||
    input.mask.height !== input.originalImage.height ||
    input.originalImage.data.length !== pixels * 4 ||
    input.mask.alpha.length !== pixels
  )
    throw new Error("PaintRenderInput contiene rasters incompatibles.");
}

function readRgb(data: Uint8ClampedArray, index: number): RgbColor {
  return { r: data[index] / 255, g: data[index + 1] / 255, b: data[index + 2] / 255 };
}

export class PaintRenderPipeline {
  render(input: PaintRenderInput): PaintRenderResult {
    assertInput(input);
    const startedAt = performance.now();
    const pixels = input.mask.alpha.length;
    const luminance = new Float32Array(pixels);
    let weightedLuminance = 0;
    let totalWeight = 0;
    for (let index = 0; index < pixels; index += 1) {
      if ((index & 2047) === 0 && input.signal?.aborted)
        throw new DOMException("Render de pintura cancelado", "AbortError");
      const value = rgbToOklab(readRgb(input.originalImage.data, index * 4)).l;
      const weight = input.mask.alpha[index] / 255;
      luminance[index] = value;
      weightedLuminance += value * weight;
      totalWeight += weight;
    }
    const averageLuminance = input.averageLuminance ?? (totalWeight ? weightedLuminance / totalWeight : 0.7);
    const localLuminance = createLocalLuminanceField(luminance, input.originalImage.width, input.originalImage.height, qualityRadius[input.quality]);
    const luminanceFinishedAt = performance.now();
    const output = new Uint8ClampedArray(pixels * 4);
    const texture = input.diagnostics ? new Float32Array(pixels) : null;
    const target = hexToRgbColor(input.targetColor);
    const targetLab = rgbToOklab(target);
    let clippedChannelCount = 0;
    const settings = {
      blendMode: input.blendMode,
      edgeFeather: input.edgeFeather,
      paintIntensity: input.paintIntensity,
      paintMode: input.paintMode,
      primerCoverage: input.primerCoverage,
      renderQuality: input.quality,
    };
    const whiteBaseSettings = {
      ...input.neutralizationSettings,
      shadowPreservation: input.shadowPreservation,
      texturePreservation: input.texturePreservation,
    };
    for (let index = 0; index < pixels; index += 1) {
      if ((index & 2047) === 0 && input.signal?.aborted)
        throw new DOMException("Render de pintura cancelado", "AbortError");
      const alpha = input.mask.alpha[index];
      if (!alpha) continue;
      const source = readRgb(input.originalImage.data, index * 4);
      const painted = processPaintPixel({
        averageLuminance,
        localLuminance: localLuminance[index],
        settings,
        source,
        target,
        targetLab,
        whiteBasePreviewOnly: input.whiteBasePreviewOnly,
        whiteBaseSettings,
      });
      for (const channel of [painted.r, painted.g, painted.b]) if (channel <= 0 || channel >= 1) clippedChannelCount += 1;
      const outputIndex = index * 4;
      output[outputIndex] = Math.round(painted.r * 255);
      output[outputIndex + 1] = Math.round(painted.g * 255);
      output[outputIndex + 2] = Math.round(painted.b * 255);
      output[outputIndex + 3] = alpha;
      if (texture) texture[index] = luminance[index] - localLuminance[index];
    }
    const finishedAt = performance.now();
    return {
      imageData: output,
      width: input.originalImage.width,
      height: input.originalImage.height,
      timings: {
        luminanceMs: luminanceFinishedAt - startedAt,
        colorMs: finishedAt - luminanceFinishedAt,
        totalMs: finishedAt - startedAt,
      },
      diagnostics: input.diagnostics ? {
        pipelineVersion: PAINT_PIPELINE_VERSION,
        luminance,
        localLuminance,
        texture: texture ?? new Float32Array(0),
        alpha: input.mask.alpha.slice(),
        clippedChannelCount,
      } : undefined,
    };
  }
}
