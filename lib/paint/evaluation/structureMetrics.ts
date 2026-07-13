import { rgbToOklab } from "@/lib/colors/colorSpace";
import { createLocalLuminanceField } from "@/lib/paint/TexturePass";

function luminance(data: Uint8ClampedArray) {
  const output = new Float32Array(data.length / 4);
  for (let index = 0; index < output.length; index += 1)
    output[index] = rgbToOklab({ r: data[index * 4] / 255, g: data[index * 4 + 1] / 255, b: data[index * 4 + 2] / 255 }).l;
  return output;
}

function selected(values: Float32Array, alpha: Uint8ClampedArray) {
  return [...values].filter((_value, index) => alpha[index] >= 230);
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function correlation(first: number[], second: number[]) {
  if (first.length !== second.length || first.length < 2) return first.length === second.length ? 1 : 0;
  const firstMean = mean(first);
  const secondMean = mean(second);
  let numerator = 0; let firstVariance = 0; let secondVariance = 0;
  for (let index = 0; index < first.length; index += 1) {
    const a = first[index] - firstMean;
    const b = second[index] - secondMean;
    numerator += a * b; firstVariance += a * a; secondVariance += b * b;
  }
  const denominator = Math.sqrt(firstVariance * secondVariance);
  return denominator > 1e-9 ? Math.max(-1, Math.min(1, numerator / denominator)) : 1;
}

function standardDeviation(values: number[]) {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

export function calculateLuminancePreservationScore(originalData: Uint8ClampedArray, renderedData: Uint8ClampedArray, alpha: Uint8ClampedArray) {
  const original = selected(luminance(originalData), alpha);
  const rendered = selected(luminance(renderedData), alpha);
  const structureCorrelation = Math.max(0, correlation(original, rendered));
  const originalDeviation = standardDeviation(original);
  const renderedDeviation = standardDeviation(rendered);
  const contrastRatio = originalDeviation > 1e-6 ? Math.min(originalDeviation, renderedDeviation) / Math.max(originalDeviation, renderedDeviation) : 1;
  return { score: (structureCorrelation * 0.7 + contrastRatio * 0.3) * 100, structureCorrelation, contrastRatio };
}

export function calculateTexturePreservationScore(originalData: Uint8ClampedArray, renderedData: Uint8ClampedArray, alpha: Uint8ClampedArray, width: number, height: number) {
  const original = luminance(originalData);
  const rendered = luminance(renderedData);
  const originalLocal = createLocalLuminanceField(original, width, height, 2);
  const renderedLocal = createLocalLuminanceField(rendered, width, height, 2);
  const originalDetail: number[] = [];
  const renderedDetail: number[] = [];
  for (let index = 0; index < alpha.length; index += 1) if (alpha[index] >= 230) {
    originalDetail.push(original[index] - originalLocal[index]);
    renderedDetail.push(rendered[index] - renderedLocal[index]);
  }
  const energyOriginal = Math.sqrt(mean(originalDetail.map((value) => value * value)));
  const energyRendered = Math.sqrt(mean(renderedDetail.map((value) => value * value)));
  const energyRatio = energyOriginal > 1e-6 ? Math.min(energyOriginal, energyRendered) / Math.max(energyOriginal, energyRendered) : 1;
  const detailCorrelation = Math.max(0, correlation(originalDetail, renderedDetail));
  return { score: (detailCorrelation * 0.65 + energyRatio * 0.35) * 100, detailCorrelation, energyRatio };
}

export function calculateShadowStructureScore(originalData: Uint8ClampedArray, renderedData: Uint8ClampedArray, alpha: Uint8ClampedArray) {
  const original = selected(luminance(originalData), alpha);
  const rendered = selected(luminance(renderedData), alpha);
  const pairs = original.map((value, index) => ({ original: value, rendered: rendered[index] })).sort((first, second) => first.original - second.original);
  const group = Math.max(1, Math.floor(pairs.length * 0.25));
  const originalShadow = mean(pairs.slice(0, group).map((item) => item.original));
  const originalLight = mean(pairs.slice(-group).map((item) => item.original));
  const renderedShadow = mean(pairs.slice(0, group).map((item) => item.rendered));
  const renderedLight = mean(pairs.slice(-group).map((item) => item.rendered));
  const originalDifference = originalLight - originalShadow;
  const renderedDifference = renderedLight - renderedShadow;
  const ratio = originalDifference > 1e-6 ? Math.max(0, Math.min(1, renderedDifference / originalDifference)) : 1;
  const ordering = renderedLight > renderedShadow ? 1 : 0;
  return { score: (ratio * 0.8 + ordering * 0.2) * 100, originalDifference, renderedDifference };
}
