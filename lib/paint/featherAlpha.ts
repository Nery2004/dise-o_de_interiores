function gaussianKernel(feather: number) {
  if (feather <= 0) return new Float32Array([1]);
  const sigma = Math.max(0.5, feather / 2);
  const radius = Math.max(1, Math.ceil(feather * 1.5));
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let offset = -radius; offset <= radius; offset += 1) {
    const value = Math.exp(-(offset * offset) / (2 * sigma * sigma));
    kernel[offset + radius] = value;
    sum += value;
  }
  for (let index = 0; index < kernel.length; index += 1) kernel[index] /= sum;
  return kernel;
}

function blurAxis(
  source: Float32Array,
  width: number,
  height: number,
  kernel: Float32Array,
  horizontal: boolean,
) {
  const output = new Float32Array(source.length);
  const radius = Math.floor(kernel.length / 2);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = 0;
      let weight = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleX = horizontal ? x + offset : x;
        const sampleY = horizontal ? y : y + offset;
        if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) continue;
        const itemWeight = kernel[offset + radius];
        value += source[sampleY * width + sampleX] * itemWeight;
        weight += itemWeight;
      }
      output[y * width + x] = weight ? value / weight : 0;
    }
  }
  return output;
}

/** Deterministic alpha-only blur. Color is never blurred over transparent black. */
export function featherAlphaMask(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  feather: number,
) {
  if (alpha.length !== width * height)
    throw new Error("El alpha no coincide con las dimensiones de feather.");
  if (feather <= 0) return alpha.slice();
  const kernel = gaussianKernel(feather);
  const normalized = Float32Array.from(alpha, (value) => value / 255);
  const horizontal = blurAxis(normalized, width, height, kernel, true);
  const vertical = blurAxis(horizontal, width, height, kernel, false);
  return Uint8ClampedArray.from(vertical, (value) => Math.round(Math.max(0, Math.min(1, value)) * 255));
}
