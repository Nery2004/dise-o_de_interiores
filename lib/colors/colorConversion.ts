export function normalizeHex(hex: string) {
  const value = hex.trim().replace(/^#/, "");
  const expanded = value.length === 3 ? value.split("").map((character) => character.repeat(2)).join("") : value;
  return /^[0-9a-f]{6}$/i.test(expanded) ? `#${expanded.toUpperCase()}` : null;
}

export function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = Number.parseInt(normalized.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex(r: number, g: number, b: number) {
  if (![r, g, b].every((value) => Number.isFinite(value) && value >= 0 && value <= 255)) return null;
  return `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function rgbToHsl(r: number, g: number, b: number) {
  const [red, green, blue] = [r, g, b].map((value) => value / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hexToHsl(hex: string) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
}

export function hslToRgb(h: number, s: number, l: number) {
  if (![h, s, l].every(Number.isFinite) || h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) return null;
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  let values = [0, 0, 0];
  if (h < 60) values = [chroma, x, 0]; else if (h < 120) values = [x, chroma, 0]; else if (h < 180) values = [0, chroma, x]; else if (h < 240) values = [0, x, chroma]; else if (h < 300) values = [x, 0, chroma]; else values = [chroma, 0, x];
  return { r: Math.round((values[0] + m) * 255), g: Math.round((values[1] + m) * 255), b: Math.round((values[2] + m) * 255) };
}

export function hslToHex(h: number, s: number, l: number) {
  const rgb = hslToRgb(((h % 360) + 360) % 360, s, l);
  return rgb ? rgbToHex(rgb.r, rgb.g, rgb.b) : null;
}

export function colorsEqual(first: string, second: string) { return normalizeHex(first) === normalizeHex(second); }
export function normalizeSearchText(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
