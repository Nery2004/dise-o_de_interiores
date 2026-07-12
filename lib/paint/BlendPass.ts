import {
  oklabToRgb,
  rgbToOklab,
  type RgbColor,
} from "@/lib/paint/colorMath";
import type { BlendMode } from "@/types/editor";

function multiply(backdrop: number, source: number) {
  return backdrop * source;
}

function screen(backdrop: number, source: number) {
  return backdrop + source - backdrop * source;
}

function overlay(backdrop: number, source: number) {
  return backdrop <= 0.5
    ? multiply(backdrop, 2 * source)
    : screen(backdrop, 2 * source - 1);
}

function hardLight(backdrop: number, source: number) {
  return source <= 0.5
    ? multiply(backdrop, 2 * source)
    : screen(backdrop, 2 * source - 1);
}

function softLight(backdrop: number, source: number) {
  if (source <= 0.5) {
    return backdrop - (1 - 2 * source) * backdrop * (1 - backdrop);
  }
  const curve =
    backdrop <= 0.25
      ? ((16 * backdrop - 12) * backdrop + 4) * backdrop
      : Math.sqrt(backdrop);
  return backdrop + (2 * source - 1) * (curve - backdrop);
}

function mapChannels(
  backdrop: RgbColor,
  source: RgbColor,
  operation: (backdropChannel: number, sourceChannel: number) => number,
): RgbColor {
  return {
    r: operation(backdrop.r, source.r),
    g: operation(backdrop.g, source.g),
    b: operation(backdrop.b, source.b),
  };
}

export function applyBlendPass(
  mode: Exclude<BlendMode, "paint-simulation">,
  backdrop: RgbColor,
  source: RgbColor,
): RgbColor {
  if (mode === "normal") return source;
  if (mode === "multiply") return mapChannels(backdrop, source, multiply);
  if (mode === "overlay") return mapChannels(backdrop, source, overlay);
  if (mode === "hard-light") return mapChannels(backdrop, source, hardLight);
  if (mode === "soft-light") return mapChannels(backdrop, source, softLight);

  const backdropLab = rgbToOklab(backdrop);
  const sourceLab = rgbToOklab(source);
  return oklabToRgb({
    l: backdropLab.l,
    a: sourceLab.a,
    b: sourceLab.b,
  });
}
