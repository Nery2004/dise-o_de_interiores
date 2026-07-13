import {
  clamp01,
  linearChannelToSrgb,
  oklabToRgb,
  relativeLuminance,
  rgbToOklab,
  srgbChannelToLinear,
  type OklabColor,
  type RgbColor,
} from "@/lib/colors/colorSpace";

export {
  clamp01,
  linearChannelToSrgb,
  relativeLuminance,
  srgbChannelToLinear,
};

export function srgbToLinear(color: RgbColor): RgbColor {
  return {
    r: srgbChannelToLinear(color.r),
    g: srgbChannelToLinear(color.g),
    b: srgbChannelToLinear(color.b),
  };
}

export function linearToSrgb(color: RgbColor): RgbColor {
  return {
    r: linearChannelToSrgb(color.r),
    g: linearChannelToSrgb(color.g),
    b: linearChannelToSrgb(color.b),
  };
}

export function oklabDeltaE(first: OklabColor, second: OklabColor) {
  return Math.hypot(first.l - second.l, first.a - second.a, first.b - second.b) * 100;
}

export function rgbDeltaE(first: RgbColor, second: RgbColor) {
  return oklabDeltaE(rgbToOklab(first), rgbToOklab(second));
}

export function oklabChroma(color: OklabColor) {
  return Math.hypot(color.a, color.b);
}

export function oklabHue(color: OklabColor) {
  const angle = Math.atan2(color.b, color.a) * 180 / Math.PI;
  return (angle + 360) % 360;
}

export function hueDistance(first: number, second: number) {
  const difference = Math.abs(first - second) % 360;
  return Math.min(difference, 360 - difference);
}

export function clampOklabToSrgb(color: OklabColor) {
  return oklabToRgb({
    l: clamp01(color.l),
    a: Math.max(-0.5, Math.min(0.5, color.a)),
    b: Math.max(-0.5, Math.min(0.5, color.b)),
  });
}

function oklabToLinearRgb(color: OklabColor): RgbColor {
  const l = color.l + 0.3963377774 * color.a + 0.2158037573 * color.b;
  const m = color.l - 0.1055613458 * color.a - 0.0638541728 * color.b;
  const s = color.l - 0.0894841775 * color.a - 1.291485548 * color.b;
  const l3 = l ** 3;
  const m3 = m ** 3;
  const s3 = s ** 3;
  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  };
}

function isInsideSrgbGamut(color: RgbColor) {
  return color.r >= 0 && color.r <= 1 && color.g >= 0 && color.g <= 1 && color.b >= 0 && color.b <= 1;
}

/** Maps OKLab to displayable sRGB while retaining lightness and hue. */
export function mapOklabToSrgb(color: OklabColor): RgbColor {
  const lightness = clamp01(color.l);
  let candidate = { ...color, l: lightness };
  let linear = oklabToLinearRgb(candidate);
  if (!isInsideSrgbGamut(linear)) {
    let low = 0;
    let high = 1;
    // Reduce chroma along the same OKLCh hue rather than clipping channels.
    for (let iteration = 0; iteration < 14; iteration += 1) {
      const scale = (low + high) / 2;
      candidate = { l: lightness, a: color.a * scale, b: color.b * scale };
      linear = oklabToLinearRgb(candidate);
      if (isInsideSrgbGamut(linear)) low = scale;
      else high = scale;
    }
    candidate = { l: lightness, a: color.a * low * 0.999, b: color.b * low * 0.999 };
    linear = oklabToLinearRgb(candidate);
  }
  return linearToSrgb(linear);
}
