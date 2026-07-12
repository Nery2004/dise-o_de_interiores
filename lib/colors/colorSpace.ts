export type RgbColor = { r: number; g: number; b: number };
export type OklabColor = { l: number; a: number; b: number };
export type HslColor = { h: number; s: number; l: number };

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function mixNumber(first: number, second: number, amount: number) {
  return first + (second - first) * clamp01(amount);
}

export function hexToRgbColor(hex: string): RgbColor {
  const normalized = hex.replace(/^#/, "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  };
}

export function rgbColorToHex(color: RgbColor) {
  return `#${[color.r, color.g, color.b]
    .map((channel) => Math.round(clamp01(channel) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function rgbToHslColor(color: RgbColor): HslColor {
  const maximum = Math.max(color.r, color.g, color.b);
  const minimum = Math.min(color.r, color.g, color.b);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta > 0) {
    if (maximum === color.r) hue = ((color.g - color.b) / delta) % 6;
    else if (maximum === color.g) hue = (color.b - color.r) / delta + 2;
    else hue = (color.r - color.g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const lightness = (maximum + minimum) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { h: hue, s: saturation, l: lightness };
}

export function hslToRgbColor(color: HslColor): RgbColor {
  const hue = ((color.h % 360) + 360) % 360;
  const saturation = clamp01(color.s);
  const lightness = clamp01(color.l);
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = lightness - chroma / 2;
  let channels = [0, 0, 0];
  if (hue < 60) channels = [chroma, x, 0];
  else if (hue < 120) channels = [x, chroma, 0];
  else if (hue < 180) channels = [0, chroma, x];
  else if (hue < 240) channels = [0, x, chroma];
  else if (hue < 300) channels = [x, 0, chroma];
  else channels = [chroma, 0, x];
  return {
    r: channels[0] + offset,
    g: channels[1] + offset,
    b: channels[2] + offset,
  };
}

export function srgbChannelToLinear(value: number) {
  const channel = clamp01(value);
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function linearChannelToSrgb(value: number) {
  const channel = Math.max(0, value);
  return clamp01(
    channel <= 0.0031308
      ? channel * 12.92
      : 1.055 * channel ** (1 / 2.4) - 0.055,
  );
}

export function rgbToOklab(color: RgbColor): OklabColor {
  const r = srgbChannelToLinear(color.r);
  const g = srgbChannelToLinear(color.g);
  const b = srgbChannelToLinear(color.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function oklabToRgb(color: OklabColor): RgbColor {
  const l = color.l + 0.3963377774 * color.a + 0.2158037573 * color.b;
  const m = color.l - 0.1055613458 * color.a - 0.0638541728 * color.b;
  const s = color.l - 0.0894841775 * color.a - 1.291485548 * color.b;
  const l3 = l ** 3;
  const m3 = m ** 3;
  const s3 = s ** 3;
  return {
    r: linearChannelToSrgb(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: linearChannelToSrgb(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: linearChannelToSrgb(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  };
}

export function relativeLuminance(color: RgbColor) {
  return (
    0.2126 * srgbChannelToLinear(color.r) +
    0.7152 * srgbChannelToLinear(color.g) +
    0.0722 * srgbChannelToLinear(color.b)
  );
}

export function mixRgb(first: RgbColor, second: RgbColor, amount: number): RgbColor {
  return {
    r: mixNumber(first.r, second.r, amount),
    g: mixNumber(first.g, second.g, amount),
    b: mixNumber(first.b, second.b, amount),
  };
}
