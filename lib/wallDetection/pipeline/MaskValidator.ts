import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import { countMaskPixels, findComponents, isBoundaryPixel } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask, MaskValidationIssue } from "@/lib/wallDetection/pipeline/types";

function issue(type: MaskValidationIssue["type"], confidence: number, severity: MaskValidationIssue["severity"]): MaskValidationIssue {
  return { type, confidence: Math.max(0, Math.min(1, confidence)), severity };
}

export class MaskValidator {
  analyze(mask: BinaryMask, polygon: WallDetectionPoint[], original: BinaryMask, exclusions: BinaryMask[] = []): MaskValidationIssue[] {
    const issues: MaskValidationIssue[] = [];
    const area = countMaskPixels(mask);
    const ratio = area / Math.max(1, mask.data.length);
    const components = findComponents(mask);
    if (ratio < 0.025) issues.push(issue("too-small", 1 - ratio / 0.025, "high"));
    if (ratio > 0.9) issues.push(issue("too-large", (ratio - 0.9) / 0.1, "high"));
    if (components.length > 1) issues.push(issue("fragmented", Math.min(1, components.length / 5), components.length > 3 ? "high" : "medium"));

    const bandHeight = Math.max(1, Math.round(mask.height * 0.035));
    let top = 0; let bottom = 0;
    for (let y = 0; y < bandHeight; y += 1) for (let x = 0; x < mask.width; x += 1) top += mask.data[y * mask.width + x] ? 1 : 0;
    for (let y = mask.height - bandHeight; y < mask.height; y += 1) for (let x = 0; x < mask.width; x += 1) bottom += mask.data[y * mask.width + x] ? 1 : 0;
    const bandArea = bandHeight * mask.width;
    if (top / bandArea > 0.85 && polygon.some((point) => point.y > mask.height * 0.08)) issues.push(issue("ceiling-invasion", top / bandArea, "medium"));
    if (bottom / bandArea > 0.85 && polygon.some((point) => point.y < mask.height * 0.92)) issues.push(issue("floor-invasion", bottom / bandArea, "medium"));

    let exclusionOverlap = 0;
    for (const exclusion of exclusions) if (exclusion.width === mask.width && exclusion.height === mask.height) {
      for (let index = 0; index < mask.data.length; index += 1) if (original.data[index] && exclusion.data[index]) exclusionOverlap += 1;
    }
    if (exclusionOverlap) issues.push(issue("window-invasion", Math.min(1, exclusionOverlap / Math.max(1, area * 0.05)), exclusionOverlap > area * 0.03 ? "high" : "medium"));

    let upperIrregularity = 0; let lowerIrregularity = 0; let centerIrregularity = 0;
    for (let y = 1; y < mask.height - 1; y += 1) for (let x = 1; x < mask.width - 1; x += 1) {
      if (!mask.data[y * mask.width + x] || !isBoundaryPixel(mask, x, y)) continue;
      if (y < mask.height * 0.35) upperIrregularity += 1;
      else if (y > mask.height * 0.65) lowerIrregularity += 1;
      else centerIrregularity += 1;
    }
    const perimeterScale = Math.max(1, Math.sqrt(area));
    if (upperIrregularity / perimeterScale > 2.8) issues.push(issue("curtain-invasion", Math.min(0.8, upperIrregularity / perimeterScale / 6), "low"));
    if (lowerIrregularity / perimeterScale > 3.2) issues.push(issue("sofa-invasion", Math.min(0.8, lowerIrregularity / perimeterScale / 7), "low"));
    if (centerIrregularity / perimeterScale > 3.5 && polygon.length > 18) issues.push(issue("picture-invasion", Math.min(0.75, centerIrregularity / perimeterScale / 8), "low"));
    return issues;
  }
}
