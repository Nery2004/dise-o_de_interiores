import { clamp01 } from "@/lib/paint/colorMath";

export function extractTexturePass(luminance: number, localLuminance: number) {
  return luminance - localLuminance;
}

export function recombineTexturePass(
  luminance: number,
  texture: number,
  strength = 0.92,
) {
  return clamp01(luminance + texture * strength);
}

export function createLocalLuminanceField(
  luminance: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  if (radius <= 0) return new Float32Array(luminance);
  const stride = width + 1;
  const integral = new Float64Array((width + 1) * (height + 1));

  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < width; x += 1) {
      rowSum += luminance[y * width + x];
      integral[(y + 1) * stride + x + 1] =
        integral[y * stride + x + 1] + rowSum;
    }
  }

  const result = new Float32Array(luminance.length);
  for (let y = 0; y < height; y += 1) {
    const top = Math.max(0, y - radius);
    const bottom = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      const left = Math.max(0, x - radius);
      const right = Math.min(width - 1, x + radius);
      const sum =
        integral[(bottom + 1) * stride + right + 1] -
        integral[top * stride + right + 1] -
        integral[(bottom + 1) * stride + left] +
        integral[top * stride + left];
      result[y * width + x] =
        sum / ((right - left + 1) * (bottom - top + 1));
    }
  }
  return result;
}
