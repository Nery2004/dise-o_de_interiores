import type { WallDetectionResult } from "@/lib/wallDetection/types";

type DetectWallsFromImageOptions = {
  width: number;
  height: number;
};

function createWallId(name: string) {
  return `${name}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export async function detectWallsFromImage({
  height,
  width,
}: DetectWallsFromImageOptions): Promise<WallDetectionResult[]> {
  // Future integration point:
  // - Connect a dedicated segmentation model.
  // - Call Replicate, Hugging Face, Roboflow, or another vision provider.
  // - Route to a private Python endpoint for SAM/Segment Anything.
  // - Replace these proportional polygons with advanced segmentation masks.
  return [
    {
      id: createWallId("wall-left"),
      name: "Pared izquierda",
      confidence: 0.9,
      points: [
        { x: width * 0.04, y: height * 0.16 },
        { x: width * 0.35, y: height * 0.08 },
        { x: width * 0.39, y: height * 0.76 },
        { x: width * 0.07, y: height * 0.88 },
      ],
    },
    {
      id: createWallId("wall-back"),
      name: "Pared fondo",
      confidence: 0.92,
      points: [
        { x: width * 0.34, y: height * 0.08 },
        { x: width * 0.7, y: height * 0.1 },
        { x: width * 0.68, y: height * 0.73 },
        { x: width * 0.39, y: height * 0.76 },
      ],
    },
    {
      id: createWallId("wall-right"),
      name: "Pared derecha",
      confidence: 0.87,
      points: [
        { x: width * 0.7, y: height * 0.1 },
        { x: width * 0.96, y: height * 0.2 },
        { x: width * 0.91, y: height * 0.87 },
        { x: width * 0.68, y: height * 0.73 },
      ],
    },
  ];
}
