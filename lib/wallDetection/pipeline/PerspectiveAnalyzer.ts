import type { ArchitectureLine, EdgeMap } from "@/lib/wallDetection/pipeline/types";

type HoughPeak = { theta: number; rho: number; votes: number };

export class PerspectiveAnalyzer {
  analyze(edgeMap: EdgeMap | null): ArchitectureLine[] {
    if (!edgeMap) return [];
    const diagonal = Math.ceil(Math.hypot(edgeMap.width, edgeMap.height));
    const angles = Array.from({ length: 36 }, (_, index) => index * 5 * Math.PI / 180);
    const accumulator = new Uint16Array(angles.length * (diagonal * 2 + 1));
    let edgeSamples = 0;
    for (let y = 1; y < edgeMap.height - 1; y += 2) for (let x = 1; x < edgeMap.width - 1; x += 2) {
      if (edgeMap.magnitude[y * edgeMap.width + x] < edgeMap.threshold) continue;
      edgeSamples += 1;
      angles.forEach((theta, angleIndex) => {
        const rho = Math.round(x * Math.cos(theta) + y * Math.sin(theta)) + diagonal;
        const index = angleIndex * (diagonal * 2 + 1) + rho;
        if (accumulator[index] < 65_535) accumulator[index] += 1;
      });
    }
    if (!edgeSamples) return [];
    const peaks: HoughPeak[] = [];
    angles.forEach((theta, angleIndex) => {
      for (let rhoIndex = 0; rhoIndex <= diagonal * 2; rhoIndex += 1) {
        const votes = accumulator[angleIndex * (diagonal * 2 + 1) + rhoIndex];
        if (votes < Math.max(8, Math.min(edgeMap.width, edgeMap.height) * 0.035)) continue;
        peaks.push({ theta, rho: rhoIndex - diagonal, votes });
      }
    });
    const selected: HoughPeak[] = [];
    for (const peak of peaks.sort((a, b) => b.votes - a.votes)) {
      if (selected.some((item) => Math.abs(item.theta - peak.theta) < 8 * Math.PI / 180 && Math.abs(item.rho - peak.rho) < 10)) continue;
      selected.push(peak);
      if (selected.length >= 14) break;
    }
    return selected.map((peak) => {
      const a = Math.cos(peak.theta);
      const b = Math.sin(peak.theta);
      const angle = ((peak.theta * 180 / Math.PI) + 180) % 180;
      const kind = angle < 15 || angle > 165 ? "vertical" : Math.abs(angle - 90) < 15 ? "horizontal" : "converging";
      return { a, b, c: -peak.rho, angle, support: Math.min(1, peak.votes / Math.max(edgeMap.width, edgeMap.height)), kind };
    });
  }
}
