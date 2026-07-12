import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

export function encodeBinaryMaskRle(mask: BinaryMask) {
  if (!mask.data.length) return [];
  const output: number[] = [mask.data[0]];
  let run = 1;
  for (let index = 1; index < mask.data.length; index += 1) {
    if (mask.data[index] === mask.data[index - 1]) run += 1;
    else { output.push(run, mask.data[index]); run = 1; }
  }
  output.push(run);
  return output;
}
